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
}

static void onPowerOff(void *sender)
{
    engine.SaveState("/state.json");
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
        if (j->processFieldsFormat(&json))
        {
            joypads.populateValuesTo(j);
        }
        else if (j->processParcel(&json))
        {
            joypads.updateValuesFrom(j);
        }
    }
    else
    {
        webServer.Ok();
    }
}

void LoadValues()
{
    if (webServer.hasArg("client"))
    {
        String s = webServer.arg("client");
        int id = s.toInt();
        Joypad *j = joypads.getById(id);
        if (j == nullptr)
        {
            Serial.printf("Unauthorized client %i\n", id);
            webServer.handleNotFound();
            return;
        }
        JsonString ret = "";
        ret.beginObject();
        ret.AddValue("tran", String(1));
        ret.beginArray("values");
        if (j->fields != nullptr)
        {
            Joypadfield *f = (Joypadfield *)(j->fields->getFirst());
            while (f != nullptr)
            {
                ret.appendComa();
                int v = f->value;
                ret += "\"" + String(v) + "\"";
                f->sent = f->value;
                f = (Joypadfield *)(f->next);
            }
        };
        ret.endArray();
        ret.endObject();
        Serial.print("LoadValues: ");
        Serial.println(ret);
        webServer.jsonOk(&ret);
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

unsigned int startEvent;
unsigned int stopEvent;
unsigned int connectedEvent;
unsigned int disconnectedEvent;
unsigned int autoEventTimeout = 3000;

void onConnected()
{
    Serial.println("onConnected()");
    connectedEvent = millis();
    engine.command("connected", 1);
}

void onDisconnected()
{
    Serial.println("onDisconnected()");
    disconnectedEvent = millis();
    engine.command("disconnected", 1);
}

void onStart()
{
    startEvent = millis();
    engine.command("start", 1);
}

void onStop()
{
    stopEvent = millis();
    engine.command("stop", 1);
}

void setup()
{
    // analogWriteFreq(6000);
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

    if (LittleFS.exists("/scripts.json"))
    {
        Serial.println("Parsing scripts.json");
        File f = LittleFS.open("/scripts.json", "r");
        scripts.load(&f);
        f.close();
    }

    engine.build(&scripts);
    engine.LoadState("/state.json");

    Item *itm = engine.elements->getFirst();
    while (itm != nullptr)
    {
        ScriptElement *el = ((ScriptElement *)itm);
        if (el->type == ScriptElementTypes::click)
        {
            joypads.setValue(el->cmd, el->state);
        }
        itm = itm->next;
    }

    Joypadfield *fld = joypads.getFirstField();
    JsonString json = "";
    json.beginObject();
    while (fld != nullptr)
    {
        json.AddValue(fld->name, String(fld->value));
        fld = (Joypadfield *)(fld->next);
    }
    json.endObject();

    Serial.print(json);

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
    webServer.on("/api/loadValues", HTTPMethod::HTTP_GET, LoadValues);

    setupController.buildConfig = setupController_buildConfig;
    setupController.saveParameter = setupController_saveParameter;
    setupController.saveConfig = setupController_saveConfig;
    setupController.setup();

    fileServer.setup();

    webServer.on("/api/ui", HTTPMethod::HTTP_GET, ui_Get);

    onStart();
}

int vBat = 0;
double _VBAT_MIN = 700;
double _VBAT_MAX = 1000;
int clientCount = 0;
uint32_t runtime = 0;

void loop()
{
    powerManager.loop();
    dnsServer.processNextRequest();
    joypads.loop();
    webServer.loop();
    engine.loop();
    if (joypads.getCount() > 0)
    {
        int _vBat = powerManager.getBatteryADC();
        vBat = _vBat;
        double bat = 0;
        if (vBat >= _VBAT_MIN && vBat <= _VBAT_MAX)
            bat = map(vBat, _VBAT_MIN, _VBAT_MAX, 0, 100.0);
        else if (vBat > _VBAT_MAX)
            bat = 100;
        else
            bat = 0;
        joypads.setValue("bat", bat);

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
    uint32_t seconds = millis() / 1000;
    if (seconds != runtime)
    {
        runtime = seconds;
        joypads.setValue("runtime", runtime);
    }
    int clients = joypads.getCount();

    if (clientCount > clients)
    {
        onDisconnected();
    }
    else if (clientCount < clients)
    {
        onConnected();
    }

    clientCount = clients;

    if (connectedEvent != 0)
    {
        if (millis() - connectedEvent > autoEventTimeout)
        {
            engine.command("connected", 0);
            connectedEvent = 0;
        }
    }

    if (disconnectedEvent != 0)
    {
        if (millis() - disconnectedEvent > autoEventTimeout)
        {
            engine.command("disconnected", 0);
            disconnectedEvent = 0;
        }
    }

    if (startEvent != 0)
    {
        if (millis() - startEvent > autoEventTimeout)
        {
            engine.command("start", 0);
            startEvent = 0;
        }
    }

    if (stopEvent != 0)
    {
        if (millis() - stopEvent > autoEventTimeout)
        {
            engine.command("stop", 0);
            stopEvent = 0;
        }
    }
}
