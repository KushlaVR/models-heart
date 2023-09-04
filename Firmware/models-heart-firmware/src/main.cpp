#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266SSDP.h>
#include <DNSServer.h>
#include <ESP8266mDNS.h>
// #include <FS.h>
#include <LittleFS.h>
#include <Json.h>
#include <Motor.h>
#include <Blinker.h>
#include <PowerManager.h>
#include <Collection.h>
#include <ui.h>
#include <WebUIController.h>
#include <Joypad.h>
#include <SetupController.h>

PowerManager powerManager(PIN_POWER_HOLD, PIN_POWER_SENSE, PIN_BATTERY_SENSE);

JsonObject ui = JsonObject();
JsonObject scripts = JsonObject();

char SSID[32] = "MODELS_HEART";
char SSID_password[20] = "12345678";
IPAddress apIP = IPAddress(192, 168, 4, 1);
IPAddress netMsk = IPAddress(255, 255, 255, 0);

const byte DNS_PORT = 53;
DNSServer dnsServer = DNSServer();

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

JoypadCollection joypads = JoypadCollection();

void EventSourceName()
{
    Serial.println(webServer.uri());
    webServer.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    webServer.sendHeader("Pragma", "no-cache");
    webServer.sendHeader("Expires", "-1");
    webServer.setContentLength(CONTENT_LENGTH_UNKNOWN);

    Joypad *j = new Joypad();
    j->client = webServer.client();
    j->clientIP = webServer.client().remoteIP();
    joypads.add(j);

    String ret = "http://" + apIP.toString() + ":80/api/events?{\"client\":\"" + String(j->id) + "\"}";
    yield();
    webServer.send(200, "text/plain", ret);
    Serial.println(ret);
}

void Events()
{
    Serial.println(webServer.uri());
    WiFiClient client = webServer.client();

    String s = webServer.argName(0);
    JsonString json = "";
    json += s;
    int id = json.getInt("client");

    // console.printf("client:%i", id);

    Joypad *j = joypads.getById(id);
    if (j == nullptr)
    {
        Serial.printf("Unauthorized client %i\n", id);
        webServer.handleNotFound();
        return;
    }
    if (client.remoteIP() != j->clientIP)
    {
        Serial.printf("wrong IP", id);
        joypads.remove(j);
        webServer.handleNotFound();
        return;
    }
    j->client = client;
    client.setNoDelay(true);
    client.setSync(true);
    webServer.setContentLength(CONTENT_LENGTH_UNKNOWN); // the payload can go on forever
    webServer.sendContent_P(PSTR("HTTP/1.1 200 OK\nContent-Type: text/event-stream;\nConnection: keep-alive\nCache-Control: no-cache\nAccess-Control-Allow-Origin: *\n\n"));
    Serial.flush();
}

void Post()
{
    if (webServer.hasArg("plain"))
    {
        String s = webServer.arg("plain");
        JsonString json = "";
        json += s;
        int id = json.getInt("client");

        // console.printf("client:%i\n", id);

        Joypad *j = joypads.getById(id);
        if (j == nullptr)
        {
            webServer.handleNotFound();
            return;
        }
        webServer.Ok();
        if (j->processParcel(&json))
        {
            joypads.updateValuesFrom(j);
        }
    }
    else
    {
        webServer.Ok();
    }
}

void setupController_buildConfig(JsonString *json)
{
    json->beginObject();

    json->AddValue("ssid", SSID);
    json->AddValue("password", SSID_password);

    String ui_JsonValue = "";
    File f = LittleFS.open("/ui.json", "r");
    f.seek(0);
    int lastChar = 0;
    while (f.available())
    {
        int c = f.read();
        if (c == '"')
        {
            ui_JsonValue += "\\\"";
        }
        else if (c == 10)
        {
            if (lastChar != 13)
                ui_JsonValue += "\\n";
        }
        else if (c == 13)
        {
            if (lastChar != 10)
                ui_JsonValue += "\\n";
        }
        else
        {
            ui_JsonValue += (char)c;
        }
        lastChar = c;
    }
    f.close();
    json->AddValue("ui", ui_JsonValue);

    ui_JsonValue = "";
    File f1 = LittleFS.open("/scripts.json", "r");
    f1.seek(0);
    lastChar = 0;
    while (f1.available())
    {
        int c = f1.read();
        if (c == '"')
        {
            ui_JsonValue += "\\\"";
        }
        else if (c == 10)
        {
            if (lastChar != 13)
                ui_JsonValue += "\\n";
        }
        else if (c == 13)
        {
            if (lastChar != 10)
                ui_JsonValue += "\\n";
        }
        else
        {
            ui_JsonValue += (char)c;
        }
        lastChar = c;
    }
    f1.close();
    json->AddValue("scripts", ui_JsonValue);
    json->endObject();
}

void setupController_saveParameter(String name, String value)
{
    if ((name).equalsIgnoreCase("ui"))
    {
        File f1 = LittleFS.open("/ui.json", "w");
        f1.seek(0);
        f1.print(value);
        f1.flush();
        f1.close();
    }

    if ((name).equalsIgnoreCase("scripts"))
    {
        File f1 = LittleFS.open("/scripts.json", "w");
        f1.seek(0);
        f1.print(value);
        f1.flush();
        f1.close();
    }
}

void ui_Get()
{
	webServer.handleFileRead("/ui.json", false);
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

    if (!LittleFS.begin())
    {
        Serial.println(F("No file system!"));
        Serial.println(F("Fomating..."));
        if (LittleFS.format())
            Serial.println(F("OK"));
        else
        {
            Serial.println(F("Fail.... rebooting..."));
            while (true)
                ;
        }
    }

    if (LittleFS.exists("/intro.txt"))
    {
        File f = LittleFS.open("/intro.txt", "r");
        String s = f.readString();
        Serial.println(s.c_str());
    }
    else
    {
        Serial.println(("Starting..."));
    }

    if (LittleFS.exists("/ui.json"))
    {
        Serial.println("Parsing ui.json");
        File f = LittleFS.open("/ui.json", "r");
        ui.load(&f);
        f.close();
        Serial.println("Print UI");
        ui.print(&Serial);
        Serial.println("");
    }

    if (LittleFS.exists("/scripts.json"))
    {
        Serial.println("Parsing scripts.json");
        File f = LittleFS.open("/scripts.json", "r");
        scripts.load(&f);
        f.close();
        Serial.println("Print Scripts");
        scripts.print(&Serial);
        Serial.println("");
    }

    WiFi.begin();
    WiFi.disconnect();
    WiFi.mode(WIFI_AP);
    WiFi.softAP(SSID, SSID_password);

    /* Setup the DNS server redirecting all the domains to the apIP */
    dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
    dnsServer.start(DNS_PORT, "*", apIP);

    Serial.println("");
    Serial.println(apIP.toString());

    // Serial.println("webServer.setup()");
    webServer.console = &Serial;
    webServer.setup();
    // Serial.println("OK");
    webServer.on("/api/EventSourceName", EventSourceName);
    webServer.on("/api/events", Events);
    webServer.on("/api/post", HTTPMethod::HTTP_POST, Post);

    setupController.buildConfig = setupController_buildConfig;
    setupController.saveParameter = setupController_saveParameter;
    setupController.setup();

    webServer.on("/api/ui", HTTPMethod::HTTP_GET, ui_Get);
}

void loop()
{
    powerManager.loop();
    dnsServer.processNextRequest();
    joypads.loop();
    webServer.loop();
    // if (joypads.getCount() > 0)
    //{
    //  Serial.println(".");
    //}
    // else
    //{
    // noone connected...
    //}
}
