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
#include <ScriptEngine.h>
#include <WebUIController.h>
#include <Joypad.h>
#include <SetupController.h>
#include <FileServer.h>

PowerManager powerManager(PIN_POWER_HOLD, PIN_POWER_SENSE, PIN_BATTERY_SENSE);

// JsonObject ui = JsonObject();
JsonObject scripts = JsonObject();
JoypadCollection joypads = JoypadCollection();
ScriptEngine engine = ScriptEngine();

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
    // Serial.print("Test number ");
    // Serial.println(testNumber);
}

static void onPowerOff(void *sender)
{
    digitalWrite(LED_BUILTIN, HIGH);
}

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
    json->endObject();
}

void setupController_saveParameter(String name, String value)
{
    if ((name).equalsIgnoreCase("ssid"))
    {
        strncpy(SSID, (value + "\0").c_str(), value.length() + 1);
    }

    if ((name).equalsIgnoreCase("password"))
    {
        strncpy(SSID_password, (value + "\0").c_str(), value.length() + 1);
    }
}

void SaveConfig()
{
    JsonString cfg = JsonString("");
    setupController_buildConfig(&cfg);
    File f = LittleFS.open("/settings.json", "w");
    f.print(cfg);
    f.flush();
    f.close();
    Serial.println(cfg);
}

void LoadConfig()
{
    if (LittleFS.exists("/settings.json"))
    {
        File f = LittleFS.open("/settings.json", "r");
        JsonString cfg = JsonString(f.readString().c_str());
        setupController_saveParameter("ssid", cfg.getValue("ssid"));
        setupController_saveParameter("password", cfg.getValue("password"));
        f.flush();
        f.close();

        cfg = JsonString("");
        setupController_buildConfig(&cfg);
        Serial.println(cfg);
    }
    else
    {
        Serial.println("load default config");
    }
}

void setupController_saveConfig(JsonString *json)
{
    SaveConfig();
}

void ui_Get()
{
    webServer.handleFileRead("/ui.json", false, false);
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
    LoadConfig();
    // if (LittleFS.exists("/ui.json"))
    // {
    //     Serial.println("Parsing ui.json");
    //     File f = LittleFS.open("/ui.json", "r");
    //     ui.load(&f);
    //     f.close();
    //     // Serial.println("Print UI");
    //     // ui.print(&Serial);
    //     // Serial.println("");
    // }

    if (LittleFS.exists("/scripts.json"))
    {
        Serial.println("Parsing scripts.json");
        File f = LittleFS.open("/scripts.json", "r");
        scripts.load(&f);
        f.close();
        // Serial.println("Print Scripts");
        // scripts.print(&Serial);
        // Serial.println("");
    }

    engine.build(&scripts);

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
    setupController.saveConfig = setupController_saveConfig;
    setupController.setup();

    fileServer.setup();

    webServer.on("/api/ui", HTTPMethod::HTTP_GET, ui_Get);
}

double vBat = -1;
void loop()
{
    powerManager.loop();
    dnsServer.processNextRequest();
    joypads.loop();
    webServer.loop();
    engine.loop();
    if (joypads.getCount() > 0)
    {
        double _vBat = ((double)powerManager.getBatteryADC() * 100.0) / 1024.0;
        if (vBat != _vBat)
        {
            vBat = _vBat;
            Serial.println(vBat);
            joypads.setValue("bat", vBat);
        }
        Joypadfield *jp = joypads.getFirstField();
        while (jp != nullptr)
        {
            engine.command(jp->name, jp->value);
            jp = (Joypadfield *)(jp->next);
        }
    }
    else
    {
        // noone connected...
    }
}
