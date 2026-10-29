#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

/*
  =============================================================================
  ROOTWISE • ESP32-S3 SMART DUAL-SENSOR IRRIGATION FIRMWARE
  =============================================================================
  Features:
  1. Dual Capacitive Soil Moisture Sensors on ADC1 pins (ADC1_CH3, ADC1_CH4).
  2. analogSetAttenuation(ADC_11db) configured so full 0-3.1V range is read
     (prevents ADC saturating at 4095 / 0% moisture).
  3. DHT11 Temperature, Relative Humidity & Vapor Pressure Deficit (VPD) reading.
  4. HARDWARE THERMAL LOCKOUT in AUTO mode when Temp > 35.0°C:
     - Automatically cuts pump power.
     - Sets thermalLockout = true in Firebase.
  5. Dual Sensor Fault Detection (if sensor divergence > 800 ADC units).
  6. Firebase Realtime Database telemetry push & bidirectional command pull.
  =============================================================================
*/

// --- Wi-Fi Credentials ---
const char* ssid = "Sunando Acharya";
const char* password = "123456789";

// --- Firebase Database URL (NO trailing slash) ---
const String FIREBASE_URL = "https://auto-irrigation-system-8225b-default-rtdb.asia-southeast1.firebasedatabase.app";

// --- Hardware Pin Definitions ---
// IMPORTANT: Both soil sensors MUST use ADC1 pins because ADC2 is disabled when Wi-Fi is active!
// On ESP32-S3: GPIO 1 to 10 are ADC1 pins.
const int SOIL1_PIN  = 4;   // Sensor 1 Analog In (ESP32-S3 ADC1_CH3)
const int SOIL2_PIN  = 5;   // Sensor 2 Analog In (ESP32-S3 ADC1_CH4)
const int RELAY_PIN  = 6;   // Pump Relay Control (Active LOW on most relay modules)
const int DHT_PIN    = 7;   // DHT11 Digital Pin

// --- Calibration Thresholds ---
// Capacitive Sensor (with 11dB attenuation):
// In dry air: ~3200 - 3500 raw ADC.
// In saturated soil / water: ~1400 - 1600 raw ADC.
const int DRY_ADC  = 3300;  // 0% moisture calibration
const int WET_ADC  = 1500;  // 100% moisture calibration

const float MAX_SAFE_TEMP = 35.0; // °C - Thermal Lockout Threshold in Auto Mode
const int AUTO_TRIGGER_MOISTURE = 40; // % - Auto water below 40%
const int AUTO_TARGET_MOISTURE  = 70; // % - Auto stop at 70%

// --- System State Variables ---
unsigned long lastCloudSync = 0;
bool autoMode = true;
bool pumpRunning = false;
bool thermalLockout = false;
bool sensorFault = false;

// --- DHT11 Bit-Bang Driver (No external DHT library dependencies required) ---
struct DHTResult {
  float temp;
  float humidity;
  bool valid;
};

DHTResult readDHT11(int pin) {
  DHTResult result = { 25.0, 60.0, false };
  uint8_t data[5] = {0, 0, 0, 0, 0};

  // Send start signal
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delay(18); // Keep LOW for at least 18ms
  digitalWrite(pin, HIGH);
  delayMicroseconds(30);
  pinMode(pin, INPUT);

  // Wait for DHT response
  unsigned long timeout = micros();
  while (digitalRead(pin) == HIGH) {
    if (micros() - timeout > 100) return result;
  }
  timeout = micros();
  while (digitalRead(pin) == LOW) {
    if (micros() - timeout > 100) return result;
  }
  timeout = micros();
  while (digitalRead(pin) == HIGH) {
    if (micros() - timeout > 100) return result;
  }

  // Read 40 bits (5 bytes)
  for (int i = 0; i < 40; i++) {
    timeout = micros();
    while (digitalRead(pin) == LOW) {
      if (micros() - timeout > 100) return result;
    }
    unsigned long pulseStart = micros();
    while (digitalRead(pin) == HIGH) {
      if (micros() - pulseStart > 150) return result;
    }
    // A high pulse of > 40 microseconds is a '1', else '0'
    if ((micros() - pulseStart) > 40) {
      data[i / 8] |= (1 << (7 - (i % 8)));
    }
  }

  // Verify checksum
  if (data[4] == ((data[0] + data[1] + data[2] + data[3]) & 0xFF)) {
    result.humidity = (float)data[0] + ((float)data[1] * 0.1);
    result.temp = (float)data[2] + ((float)data[3] * 0.1);
    result.valid = true;
  }

  return result;
}

// Calculate Vapor Pressure Deficit (VPD) in kPa
float calculateVPD(float tempC, float humidityPct) {
  // Saturation vapor pressure (Tetens formula)
  float es = 0.61078 * exp((17.27 * tempC) / (tempC + 237.3));
  // Actual vapor pressure
  float ea = es * (humidityPct / 100.0);
  // VPD in kPa
  float vpd = es - ea;
  return (vpd < 0.0) ? 0.0 : vpd;
}

// Filtered ADC reading (averages 10 samples to eliminate noise)
int readFilteredADC(int pin) {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(pin);
    delay(5);
  }
  return (int)(sum / 10);
}

// Convert raw ADC to calibrated moisture percentage (0 - 100%)
int convertAdcToPct(int rawAdc) {
  if (rawAdc >= DRY_ADC) return 0;
  if (rawAdc <= WET_ADC) return 100;
  float pct = ((float)(DRY_ADC - rawAdc) / (float)(DRY_ADC - WET_ADC)) * 100.0;
  return (int)constrain(pct, 0.0, 100.0);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n🌱 ROOTWISE ESP32-S3 INITIALIZING...");

  // CRITICAL: Configure ADC attenuation to 11dB (allows reading up to ~3.1V)
  // Without this, the ESP32 defaults to 0dB (~1.1V max), saturating at 4095 (0% moisture)!
  analogSetAttenuation(ADC_11db);

  // Relay initialization (Active LOW: HIGH = OFF, LOW = ON)
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Pump OFF by default

  // Analog pins configured as normal analog inputs
  pinMode(SOIL1_PIN, INPUT);
  pinMode(SOIL2_PIN, INPUT);

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️ Wi-Fi Connection Failed. Running offline safeguards.");
  }
}

void loop() {
  // Sync with cloud every 3 seconds
  if (millis() - lastCloudSync >= 3000) {
    lastCloudSync = millis();

    // 1. Read Soil Moisture from Dual Capacitive Sensors
    int rawSoil1 = readFilteredADC(SOIL1_PIN);
    int rawSoil2 = readFilteredADC(SOIL2_PIN);
    int avgRaw = (rawSoil1 + rawSoil2) / 2;

    // Check for sensor divergence fault (divergence > 800 ADC units)
    sensorFault = (abs(rawSoil1 - rawSoil2) > 800);

    // Compute averaged moisture percentage
    int moisturePct = convertAdcToPct(avgRaw);

    // 2. Read Microclimate Telemetry (DHT11)
    DHTResult dht = readDHT11(DHT_PIN);
    float currentTemp = dht.valid ? dht.temp : 28.0;
    float currentHumidity = dht.valid ? dht.humidity : 60.0;
    float currentVpd = calculateVPD(currentTemp, currentHumidity);

    // 3. THERMAL LOCKOUT EVALUATION
    // When temperature exceeds 35°C, thermalLockout is ACTIVE.
    thermalLockout = (currentTemp > MAX_SAFE_TEMP);

    // 4. AUTOMATIC IRRIGATION CONTROL LOGIC (with Thermal Lockout)
    if (autoMode) {
      if (thermalLockout) {
        // SAFETY LOCKOUT: Force pump OFF when temp exceeds 35°C to protect root systems
        digitalWrite(RELAY_PIN, HIGH);
        pumpRunning = false;
        Serial.println("⚠️ [THERMAL LOCKOUT ACTIVE] Temp: " + String(currentTemp, 1) + "°C > 35°C. Auto irrigation paused.");
      } else if (sensorFault) {
        // SENSOR FAULT: Pause auto irrigation if sensors diverge wildly
        digitalWrite(RELAY_PIN, HIGH);
        pumpRunning = false;
        Serial.println("🚨 [SENSOR FAULT] Probes diverge significantly. Auto irrigation paused.");
      } else {
        // Normal Auto Irrigation
        if (moisturePct < AUTO_TRIGGER_MOISTURE) {
          digitalWrite(RELAY_PIN, LOW); // Turn Pump ON
          pumpRunning = true;
          Serial.println("💧 [AUTO IRRIGATION] Moisture: " + String(moisturePct) + "% < " + String(AUTO_TRIGGER_MOISTURE) + "%. Pump ON.");
        } else if (moisturePct >= AUTO_TARGET_MOISTURE) {
          digitalWrite(RELAY_PIN, HIGH); // Turn Pump OFF
          pumpRunning = false;
          Serial.println("🌱 [TARGET REACHED] Moisture: " + String(moisturePct) + "% >= " + String(AUTO_TARGET_MOISTURE) + "%. Pump OFF.");
        } else {
          // Maintain current state unless turned off
          pumpRunning = (digitalRead(RELAY_PIN) == LOW);
        }
      }
    } else {
      // In Manual Mode: pump state is controlled strictly by user commands
      pumpRunning = (digitalRead(RELAY_PIN) == LOW);
    }

    // 5. SEND TELEMETRY TO FIREBASE (PUT request to /telemetry.json)
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String url = FIREBASE_URL + "/telemetry.json";
      http.begin(url);
      http.addHeader("Content-Type", "application/json");

      // Construct JSON payload
      String payload = "{";
      payload += "\"soil1\":" + String(rawSoil1) + ",";
      payload += "\"soil2\":" + String(rawSoil2) + ",";
      payload += "\"avgMoisture\":" + String(avgRaw) + ",";
      payload += "\"moisture\":" + String(avgRaw) + ",";
      payload += "\"moisturePct\":" + String(moisturePct) + ",";
      payload += "\"temp\":\"" + String(currentTemp, 1) + "\",";
      payload += "\"humidity\":\"" + String(currentHumidity, 1) + "\",";
      payload += "\"vpd\":\"" + String(currentVpd, 2) + "\",";
      payload += "\"pumpOn\":" + String(pumpRunning ? "true" : "false") + ",";
      payload += "\"autoMode\":" + String(autoMode ? "true" : "false") + ",";
      payload += "\"thermalLockout\":" + String(thermalLockout ? "true" : "false") + ",";
      payload += "\"sensorFault\":" + String(sensorFault ? "true" : "false");
      payload += "}";

      int httpResponseCode = http.PUT(payload);
      if (httpResponseCode > 0) {
        Serial.println("☁️ Telemetry Synced -> Moisture: " + String(moisturePct) + "% | Temp: " + String(currentTemp, 1) + "°C | Lockout: " + (thermalLockout ? "YES" : "NO"));
      } else {
        Serial.println("❌ Telemetry PUT failed, code: " + String(httpResponseCode));
      }
      http.end();

      // 6. FETCH COMMANDS FROM FIREBASE (GET request from /commands.json)
      http.begin(FIREBASE_URL + "/commands.json");
      int getCode = http.GET();
      if (getCode > 0) {
        String response = http.getString();
        
        // Mode Switch Command
        if (response.indexOf("\"mode\":\"manual\"") != -1) {
          autoMode = false;
        } else if (response.indexOf("\"mode\":\"auto\"") != -1) {
          autoMode = true;
        }

        // Manual Pump Actuation (only executes in Manual Mode)
        if (!autoMode) {
          if (response.indexOf("\"pump\":\"on\"") != -1) {
            digitalWrite(RELAY_PIN, LOW); // Turn Pump ON
            pumpRunning = true;
          } else if (response.indexOf("\"pump\":\"off\"") != -1) {
            digitalWrite(RELAY_PIN, HIGH); // Turn Pump OFF
            pumpRunning = false;
          }
        }
      }
      http.end();
    }
  }
}
