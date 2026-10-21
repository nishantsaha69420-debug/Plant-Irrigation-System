#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Make sure to install ArduinoJson via Library Manager if you haven't

// --- Wi-Fi Credentials ---
const char* ssid = "Sunando Acharya";
const char* password = "123456789";

// --- Firebase Database URL (Paste your URL here, NO trailing slash!) ---
const String FIREBASE_URL = "https://auto-irrigation-system-8225b-default-rtdb.asia-southeast1.firebasedatabase.app/";

// --- Hardware Pins ---
const int RELAY_PIN = 6;
const int SOIL_PIN  = 5;
const int MOISTURE_THRESHOLD = 2500;

unsigned long lastCloudSync = 0;
bool autoMode = true;
bool manualPumpState = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Pump OFF by default
  pinMode(SOIL_PIN, INPUT);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");
}

void loop() {
  // Sync with cloud every 3 seconds
  if (millis() - lastCloudSync >= 3000) {
    lastCloudSync = millis();

    int moistureVal = analogRead(SOIL_PIN);

    // 1. Local Auto Logic
    if (autoMode) {
      if (moistureVal > MOISTURE_THRESHOLD) {
        digitalWrite(RELAY_PIN, LOW);  // Pump ON
      } else {
        digitalWrite(RELAY_PIN, HIGH); // Pump OFF
      }
    }

    // Check actual relay state
    bool pumpRunning = (digitalRead(RELAY_PIN) == LOW);

    // 2. Send Telemetry to Firebase (PUT request)
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String url = FIREBASE_URL + "/telemetry.json";
      http.begin(url);
      http.addHeader("Content-Type", "application/json");

      String payload = "{\"moisture\":" + String(moistureVal) + 
                       ",\"pumpOn\":" + String(pumpRunning ? "true" : "false") + 
                       ",\"autoMode\":" + String(autoMode ? "true" : "false") + "}";

      int httpResponseCode = http.PUT(payload);
      http.end();

      // 3. Fetch Commands from Firebase (GET request)
      http.begin(FIREBASE_URL + "/commands.json");
      int getCode = http.GET();
      if (getCode > 0) {
        String response = http.getString();
        // Simple string parsing for commands
        if (response.indexOf("\"mode\":\"manual\"") != -1) {
          autoMode = false;
        } else if (response.indexOf("\"mode\":\"auto\"") != -1) {
          autoMode = true;
        }
        
        if (!autoMode) {
          if (response.indexOf("\"pump\":\"on\"") != -1) {
            digitalWrite(RELAY_PIN, LOW);
          } else if (response.indexOf("\"pump\":\"off\"") != -1) {
            digitalWrite(RELAY_PIN, HIGH);
          }
        }
      }
      http.end();
      
      Serial.println("Synced with Firebase | Moisture: " + String(moistureVal));
    }
  }
}