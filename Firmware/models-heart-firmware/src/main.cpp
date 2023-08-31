#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <ESP8266mDNS.h>
#include <FS.h>
#include <Json.h>
#include <Motor.h>
#include <Blinker.h>
#include <board.h>
#include <Collection.h>
#include <ui.h>

PowerManager powerManager(PIN_POWER_HOLD, PIN_POWER_SENSE, PIN_BATTERY_SENSE);
JsonObject ui;
JsonObject scripts;

int testNumber = 0;

static void powerButton_Click(void *sender)
{
    testNumber++;
    if (testNumber == 10)
        testNumber = 0;
    Serial.print("Test number ");
    Serial.println(testNumber);
}

static void onPowerOff(void *sender)
{
    digitalWrite(LED_BUILTIN, HIGH);
}

void setup()
{
    powerManager.begin();
    powerManager.OnPowerPress = powerButton_Click;
    powerManager.OnPowerOff = onPowerOff;
    pinMode(PIN_POWER_SENSE, INPUT);

    Serial.begin(115200);
    Serial.println("");
    Serial.println("");
    Serial.println("Open Source Model's Heart");
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, LOW);
    powerManager.powerOn();
    Serial.println("Power Manager is holding power On. You can releas power button.");

    if (!SPIFFS.begin())
    {
        Serial.println(F("No file system!"));
        Serial.println(F("Fomating..."));
        if (SPIFFS.format())
            Serial.println(F("OK"));
        else
        {
            Serial.println(F("Fail.... rebooting..."));
            while (true)
                ;
        }
    }

    if (SPIFFS.exists("/intro.txt"))
    {
        File f = SPIFFS.open("/intro.txt", "r");
        String s = f.readString();
        Serial.println(s.c_str());
    }
    else
    {
        Serial.println(("Starting..."));
    }

    if (SPIFFS.exists("/ui.json"))
    {
        Serial.println("Parsing ui.json");
        File f = SPIFFS.open("/ui.json", "r");
        ui.load(&f);
        f.close();
        Serial.println("Print UI");
        ui.print(&Serial);
        Serial.println("");
    }

    if (SPIFFS.exists("/scripts.json"))
    {
        Serial.println("Parsing scripts.json");
        File f = SPIFFS.open("/scripts.json", "r");
        scripts.load(&f);
        f.close();
        Serial.println("Print Scripts");
        scripts.print(&Serial);
        Serial.println("");
    }
}

void loop()
{
    powerManager.loop();
}
