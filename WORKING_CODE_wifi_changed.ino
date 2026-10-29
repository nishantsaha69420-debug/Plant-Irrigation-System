#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

// --- Wi-Fi Credentials ---
const char* ssid = "Nishant ka phone";
const char* password = "nishant1234";

// --- Firebase Database URL (NO trailing slash) ---
const String FIREBASE_URL = "https://auto-irrigation-system-8225b-default-rtdb.asia-southeast1.firebasedatabase.app";

// --- Hardware Pins ---
const int DHT_PIN    = 4; // DHT11 Data Pin
const int SOIL_PIN_1 = 5; // Soil Sensor 1 (AO)
const int RELAY_PIN  = 6; // Relay IN Pin
const int SOIL_PIN_2 = 7; // Soil Sensor 2 (AO)

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

// --- Thresholds & Calibration ---
const int DRY_ADC_VAL          = 4095; // ADC reading in dry air (0% moisture)
const int WET_ADC_VAL          = 1200; // ADC reading submerged in water (100% moisture)
const int MOISTURE_THRESHOLD   = 2500; // Above this = Dry soil (Pump ON)
const int CRITICAL_WILT_LIMIT  = 3500; // Emergency dry limit (overrides heat lockout)
const float MAX_SAFE_TEMP      = 35.0; // Thermal lockout above 35C
const int SENSOR_DELTA_LIMIT   = 5000; // Set to 5000 for 1-cup testing (Change to 1000 for fault demo)

// --- Independent Non-Blocking Timers ---
unsigned long lastSerialPrint = 0; // Runs every 1 second (1000 ms)
unsigned long lastCloudSync   = 0; // Runs every 3 seconds (3000 ms)

bool autoMode = true;

// Shared state variables
int soil1 = 0, soil2 = 0, avgMoisture = 0, moisturePct = 0;
float tempC = 0.0, humidity = 0.0, vpd = 0.0;
bool dhtError = false, sensorFault = false, thermalLockout = false, pumpRunning = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // CRITICAL: Configure ADC attenuation to 11dB (0 - 3.1V full-scale)
  // Without this, ESP32 ADC caps at 1.1V, causing soil sensors to read 4095 (0% moisture)!
  analogSetAttenuation(ADC_11db);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Pump OFF by default (Active-LOW relay)

  pinMode(SOIL_PIN_1, INPUT);
  pinMode(SOIL_PIN_2, INPUT);

  dht.begin();

  // Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi! IP: " + WiFi.localIP().toString());
}

void loop() {
  unsigned long currentMillis = millis();

  // =========================================================================
  // TASK 1: READ SENSORS & PRINT TO SERIAL MONITOR EVERY 1 SECOND (1000 ms)
  // =========================================================================
  if (currentMillis - lastSerialPrint >= 1000) {
    lastSerialPrint = currentMillis;

    // 1. Read Soil Sensors & Calculate Average + Percentage (0-100%)
    soil1 = analogRead(SOIL_PIN_1);
    soil2 = analogRead(SOIL_PIN_2);
    avgMoisture = (soil1 + soil2) / 2;
    moisturePct = constrain(map(avgMoisture, DRY_ADC_VAL, WET_ADC_VAL, 0, 100), 0, 100);

    sensorFault = (abs(soil1 - soil2) > SENSOR_DELTA_LIMIT);

    // 2. Read Temperature & Humidity from DHT11
    float rawTemp = dht.readTemperature();
    float rawHum  = dht.readHumidity();

    if (isnan(rawTemp) || isnan(rawHum)) {
      dhtError = true;
    } else {
      dhtError = false;
      tempC = rawTemp;
      humidity = rawHum;
      // Calculate Vapor Pressure Deficit (VPD in kPa)
      float es = 0.61078 * exp((17.27 * tempC) / (tempC + 237.3));
      vpd = es * (1.0 - (humidity / 100.0));
    }

    // 3. Evaluate Local Auto Logic
    // When temperature exceeds 35°C, thermalLockout is STRICTLY ENFORCED in Auto mode
    thermalLockout = (!dhtError && tempC > MAX_SAFE_TEMP);

    if (autoMode) {
      if (thermalLockout) {
        digitalWrite(RELAY_PIN, HIGH); // Pump strictly LOCKED OUT (OFF) when temp > 35°C
      } else if (sensorFault) {
        digitalWrite(RELAY_PIN, HIGH); // Pump OFF on sensor fault
      } else if (avgMoisture > MOISTURE_THRESHOLD) {
        digitalWrite(RELAY_PIN, LOW);  // Pump ON (Dry soil)
      } else {
        digitalWrite(RELAY_PIN, HIGH); // Pump OFF
      }
    }

    pumpRunning = (digitalRead(RELAY_PIN) == LOW);

    // 4. Print 1-Second Live Update to Serial Monitor
    if (dhtError) {
      Serial.printf("[1s Live] Temp: DHT_ERR | Soil1: %d | Soil2: %d | Avg: %d (%d%%) | Pump: %s\n",
                    soil1, soil2, avgMoisture, moisturePct, pumpRunning ? "ON" : "OFF");
    } else {
      Serial.printf("[1s Live] Temp: %.1f °C | Hum: %.1f %% | VPD: %.2f kPa | Soil1: %d | Soil2: %d | Avg: %d (%d%%) | Pump: %s\n",
                    tempC, humidity, vpd, soil1, soil2, avgMoisture, moisturePct, pumpRunning ? "ON" : "OFF");
    }
  }

  // =========================================================================
  // TASK 2: SYNC WITH FIREBASE CLOUD EVERY 3 SECONDS (3000 ms)
  // =========================================================================
  if (currentMillis - lastCloudSync >= 3000) {
    lastCloudSync = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setInsecure();
      HTTPClient http;

      // 1. Fetch Remote Commands from Firebase
      if (http.begin(client, FIREBASE_URL + "/commands.json")) {
        int getCode = http.GET();
        if (getCode == HTTP_CODE_OK) {
          String response = http.getString();
          JsonDocument cmdDoc;
          if (!deserializeJson(cmdDoc, response)) {
            const char* modeStr = cmdDoc["mode"];
            const char* pumpStr = cmdDoc["pump"];

            if (modeStr) {
              if (strcmp(modeStr, "manual") == 0) autoMode = false;
              else if (strcmp(modeStr, "auto") == 0) autoMode = true;
            }

            if (!autoMode && pumpStr) {
              if (strcmp(pumpStr, "on") == 0) digitalWrite(RELAY_PIN, LOW);
              else if (strcmp(pumpStr, "off") == 0) digitalWrite(RELAY_PIN, HIGH);
            }
          }
        }
        http.end();
      }

      pumpRunning = (digitalRead(RELAY_PIN) == LOW);

      // 2. Push Latest Telemetry to Firebase
      JsonDocument telDoc;
      telDoc["moisture"]       = avgMoisture;
      telDoc["avgMoisture"]    = avgMoisture;
      telDoc["moisturePct"]    = moisturePct;
      telDoc["soil1"]          = soil1;
      telDoc["soil2"]          = soil2;
      telDoc["temp"]           = serialized(String(tempC, 1));
      telDoc["humidity"]       = serialized(String(humidity, 1));
      telDoc["vpd"]            = serialized(String(vpd, 2));
      telDoc["pumpOn"]         = pumpRunning;
      telDoc["autoMode"]       = autoMode;
      telDoc["sensorFault"]    = sensorFault;
      telDoc["thermalLockout"] = thermalLockout;

      String payload;
      serializeJson(telDoc, payload);

      if (http.begin(client, FIREBASE_URL + "/telemetry.json")) {
        http.addHeader("Content-Type", "application/json");
        int putCode = http.PUT(payload);
        http.end();
        Serial.printf("   >>> [Cloud Synced - HTTP %d]\n", putCode);
      }
    } else {
      Serial.println("   >>> [Wi-Fi Disconnected! Reconnecting...]");
      WiFi.reconnect();
    }
  }
}