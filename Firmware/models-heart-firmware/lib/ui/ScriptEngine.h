#pragma once

#include <Arduino.h>
#include <Collection.h>
#include <LittleFS.h>
#include <Print.h>
#include <ui.h>
#include <Blinker.h>

enum ScriptElementTypes
{
    none = 0,
    toggle = 1,
    click = 2
};

class ActionElement : public Item
{
public:
    ActionElement() : Item(){};
    virtual ~ActionElement() {}

    String type = "none";

    virtual void loop(){

    };

    virtual void build(JsonElement *src)
    {
        Serial.print("ActionElement.build(not implemented)=>");
        src->print(&Serial);
        Serial.println();
    }

    virtual void setState(int state)
    {
    }

    virtual void OnCommand(String cmd, int state)
    {
    }

    static int pinToGPIO(int pin)
    {
        if (pin == 1)
            return 14;
        if (pin == 2)
            return 5;
        if (pin == 3)
            return 4;
        if (pin == 4)
            return 2;
        if (pin == 5)
            return 0;
        return 14;
    }
};

class BlinkActionElement : public ActionElement
{
public:
    BlinkActionElement() : ActionElement(){};
    ~BlinkActionElement() {}

    Blinker *blinker = nullptr;

    void loop() override
    {
        if (blinker == nullptr)
            return;
        blinker->loop();
    };

    void build(JsonElement *src) override
    {
        blinker = new Blinker("Blinker" + String(src->Index));
        JsonElementProperty *pts = src->getPropertyByName("points");
        Item *itm = pts->collection->getFirst();
        while (itm != nullptr)
        {
            JsonElementProperty *pt = (JsonElementProperty *)itm;
            blinker->Add(
                pinToGPIO(pt->object->getValue("pin").toInt()),
                pt->object->getValue("offset").toInt(),
                pt->object->getValue("value").toInt());
            itm = itm->next;
        }
    }

    virtual void setState(int state) override
    {
        if (blinker == nullptr)
            return;
        if (state)
        {
            if (!blinker->isRunning())
                blinker->begin();
        }
        else
        {
            if (blinker->isRunning())
                blinker->end();
        }
    }
};

class MotorActionElement : public ActionElement
{

private:
    PhysicsEffects *effect = nullptr;
    HBridge *motor = nullptr;
    String speedCommand = "";
    int currentState = 0;
    int currentSpeed = 0;

public:
    MotorActionElement() : ActionElement(){};
    ~MotorActionElement() {}

    void loop() override
    {
        if (motor == nullptr)
            return;
        motor->loop();
    };

    void build(JsonElement *src) override
    {
        Serial.println("Motor build");
        effect = new PhysicsEffects();
        int pinA = PIN_MOTOR_A;
        int pinB = PIN_MOTOR_B;
        String v = src->getValue("a");
        if (v.length() > 0)
            pinA = v.toInt();
        v = src->getValue("b");
        if (v.length() > 0)
            pinB = v.toInt();
        motor = new HBridge("motor", pinA, pinB, effect);
        motor->responder = &Serial;
        motor->isEnabled = true;
        // weight
        v = src->getValue("weight");
        if (v.length() > 0)
            motor->setWeight(v.toInt());
        v = src->getValue("speed");
        if (v.length() > 0)
            speedCommand = v;
        Serial.println(speedCommand);
        motor->setSpeed(0);
        currentSpeed = 0;
    }

    virtual void OnCommand(String cmd, int state)
    {
        if (motor == nullptr)
            return;

        if (speedCommand.equalsIgnoreCase(cmd))
        {
            // Serial.println("motor");
            if (motor->isEnabled)
                currentSpeed = map(state, -100, 100, -255, 255);
            if (currentState)
            {
                motor->setSpeed(currentSpeed);
            }
            else
            {
                motor->setSpeed(0);
            }
        }
    }

    virtual void setState(int state) override
    {
        if (motor == nullptr)
            return;

        currentState = state;
        if (currentState)
        {
            motor->setSpeed(currentSpeed);
        }
        else
        {
            motor->setSpeed(0);
        }
    }
};

class ScriptElement : public Item
{
public:
    ScriptElement() : Item(){};

    ~ScriptElement()
    {
        clear();
    };

    void clear()
    {
        if (actions != nullptr)
        {
            Item *itm = actions->getFirst();
            while (itm != nullptr)
            {
                Item *next = itm->next;
                actions->remove(itm);
                delete itm;
                itm = next;
            }
        }
    }

    void loop()
    {
        if (actions == nullptr)
            return;

        Item *itm = actions->getFirst();
        while (itm != nullptr)
        {
            ((ActionElement *)itm)->loop();
            itm = itm->next;
        }
    }

    int state = 0;
    String cmd = "";
    ScriptElementTypes type = ScriptElementTypes::none;
    Collection *actions = nullptr;

    VirtualButton *btn = nullptr;

    ScriptElementTypes TypeNameToInt(String typeName)
    {
        if (typeName.equalsIgnoreCase("toggle"))
            return ScriptElementTypes::toggle;
        if (typeName.equalsIgnoreCase("click"))
            return ScriptElementTypes::click;
        return ScriptElementTypes::none;
    }

    void build(JsonElementProperty *src)
    {
        yield();
        if (src == nullptr)
            return;
        if (src->valuType != JsonElementPropertyValueTypes::object)
            return;
        JsonElement *el = src->object;
        cmd = el->getValue("cmd");
        String tp = el->getValue("type");
        if (tp.length() > 0)
            type = TypeNameToInt(tp);
        JsonElementProperty *act = el->getPropertyByName("actions");
        if (act == nullptr)
            return;
        if (act->valuType != JsonElementPropertyValueTypes::collection)
            return;
        Item *itm = act->collection->getFirst();
        while (itm != nullptr)
        {
            addAction(((JsonElementProperty *)itm)->object);
            itm = itm->next;
        }
    }

    void addAction(JsonElement *act)
    {
        String tp = act->getValue("type");
        if (actions == nullptr)
            actions = new Collection();
        if (tp.equalsIgnoreCase("blink"))
        {
            BlinkActionElement *ba = new BlinkActionElement();
            ba->type = tp;
            ba->build(act);
            actions->add((Item *)ba);
        }
        else if (tp.equalsIgnoreCase("motor"))
        {
            MotorActionElement *ma = new MotorActionElement();
            ma->type = tp;
            ma->build(act);
            actions->add((Item *)ma);
        }
        else
        {
            Serial.println("ScriptElement.buil.addAction->unknown type");
        }
    }

    static void btn_Press(void *sender)
    {
        VirtualButton *btn = (VirtualButton *)sender;
        ScriptElement *el = (ScriptElement *)(btn->tag);
        el->refreshState();
    }

    static void btn_Hold(void *sender)
    {
    }

    static void btn_Release(void *sender)
    {
        VirtualButton *btn = (VirtualButton *)sender;
        ScriptElement *el = (ScriptElement *)(btn->tag);
        el->refreshState();
    }

    void CreateButton()
    {
        btn = new VirtualButton(btn_Press, btn_Hold, btn_Release);
        if (type == ScriptElementTypes::toggle)
        {
            btn->isToggleMode = true;
        }
        else
        {
            btn->isToggleMode = false;
        }
        btn->condition = HIGH;
        btn->tag = this;
    }

    void OnCommand(String cmd, int state)
    {
        if (this->cmd != nullptr && this->cmd.equalsIgnoreCase(cmd) && this->state != state)
        {
            this->state = state;
            if (btn == nullptr)
            {
                CreateButton();
            }
            if (state)
            {
                btn->setValue(HIGH);
            }
            else
            {
                btn->setValue(LOW);
            }
        }

        if (this->actions != nullptr)
        {
            ActionElement *ae = (ActionElement *)(this->actions->getFirst());
            while (ae != nullptr)
            {
                ae->OnCommand(cmd, state);
                ae = (ActionElement *)(ae->next);
            }
        }
    }

    void refreshState()
    {
        Serial.println("refreshState");
        if (actions == nullptr)
            return;
        Item *itm = actions->getFirst();
        while (itm != nullptr)
        {
            ActionElement *el = ((ActionElement *)itm);
            if (type == ScriptElementTypes::toggle)
                el->setState(btn->isToggled);
            else if (type == ScriptElementTypes::click)
                el->setState(btn->isPressed());
            else
                el->setState(state);
            itm = itm->next;
        }
    }

    int GetState()
    {
        if (btn == nullptr)
            return 0;
        if (type == ScriptElementTypes::toggle)
            return btn->isToggled;
        else if (type == ScriptElementTypes::click)
            return btn->isPressed();
        else
            return state;
    }

    void loadState(int state)
    {
        if (state == 0)
            return;
        if (type == ScriptElementTypes::toggle)
        {
            if (btn == nullptr)
                CreateButton();
            btn->isToggled = (state != 0);
        }
        else if (type == ScriptElementTypes::click)
        {
            if (btn == nullptr)
                CreateButton();
            if (state == 0)
                btn->setValue(0);
            else
                btn->setValue(state);
        }
        else
            this->state = state;
        this->refreshState();
    }
};

class ScriptEngine
{

public:
    ScriptEngine(){

    };

    ~ScriptEngine(){};
    Collection *elements = nullptr;

    void clear()
    {
        if (elements == nullptr)
            return;
        Item *itm = elements->getFirst();
        while (itm != nullptr)
        {
            Item *next = itm->next;
            elements->remove(itm);
            delete itm;
            itm = next;
        }
    }

    void build(JsonObject *src)
    {
        clear();
        JsonElementProperty *prop = src->getPropertyByName("elements");
        if (prop == nullptr)
            return;
        if (prop->valuType != JsonElementPropertyValueTypes::collection)
            return;

        if (elements == nullptr)
            elements = new Collection();

        Item *itm = prop->collection->getFirst();
        while (itm != nullptr)
        {
            ScriptElement *el = new ScriptElement();
            el->build((JsonElementProperty *)itm);
            elements->add((Item *)el);
            itm = itm->next;
        }
    }

    void loop()
    {
        if (elements == nullptr)
            return;
        Item *itm = elements->getFirst();
        while (itm != nullptr)
        {
            ((ScriptElement *)itm)->loop();
            itm = itm->next;
        }
    }

    ScriptElement *getScriptElementByCmd(String cmd)
    {
        Item *itm = elements->getFirst();
        while (itm != nullptr)
        {
            ScriptElement *el = ((ScriptElement *)itm);
            if (el->cmd.equalsIgnoreCase(cmd))
                return el;
            itm = itm->next;
        }
        return nullptr;
    }

    void command(String cmd, int state)
    {
        ScriptElement *el = nullptr;
        Item *itm = elements->getFirst();
        while (itm != nullptr)
        {
            el = ((ScriptElement *)itm);
            el->OnCommand(cmd, state);
            itm = itm->next;
        }
    }

    void SaveState(String fileName)
    {
        JsonString state = JsonString();
        state.beginObject();
        Item *itm = elements->getFirst();
        while (itm != nullptr)
        {
            ScriptElement *el = ((ScriptElement *)itm);
            state.AddValue(el->cmd, String(el->GetState()));
            itm = itm->next;
        }
        state.endObject();
        Serial.println(state);
        File f = LittleFS.open(fileName, "w");
        f.print(state);
        f.flush();
        f.close();
    }

    void LoadState(String fileName)
    {
        if (LittleFS.exists(fileName))
        {
            File f = LittleFS.open(fileName, "r");
            String s = f.readString();
            JsonString json = JsonString(s.c_str());
            Serial.println(json);

            Item *itm = elements->getFirst();
            while (itm != nullptr)
            {
                ScriptElement *el = ((ScriptElement *)itm);
                int state = json.getInt((char *)el->cmd.c_str());
                el->loadState(state);
                itm = itm->next;
            }
        }
    }
};