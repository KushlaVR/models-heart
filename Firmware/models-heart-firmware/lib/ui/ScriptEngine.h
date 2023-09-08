#pragma once

#include <Arduino.h>
#include <Collection.h>
#include <LittleFS.h>
#include <Print.h>
#include <ui.h>
#include <Blinker.h>

enum ScriptElementTypes
{
    click = 0,
    tougle = 1
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

    virtual void setState(bool state)
    {
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

    int pinToGPIO(int pin)
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

    virtual void setState(bool state) override
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

    bool state = false;
    String cmd = "";
    ScriptElementTypes type = ScriptElementTypes::click;
    Collection *actions = nullptr;

    VirtualButton *btn = nullptr;

    ScriptElementTypes TypeNameToInt(String typeName)
    {
        if (typeName.equalsIgnoreCase("tougle"))
            return ScriptElementTypes::tougle;
        return ScriptElementTypes::click;
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

    void OnCommand(bool state)
    {
        if (this->state == state)
            return;
        this->state = state;
        if (btn == nullptr)
        {
            btn = new VirtualButton(btn_Press, btn_Hold, btn_Release);
            if (type == ScriptElementTypes::tougle)
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
        if (state)
        {
            btn->setValue(HIGH);
        }
        else
        {
            btn->setValue(LOW);
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
            if (type == ScriptElementTypes::tougle)
                el->setState(btn->isToggled);
            else
                el->setState(btn->isPressed());
            itm = itm->next;
        }
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

    void command(String cmd, bool state)
    {
        ScriptElement *el = getScriptElementByCmd(cmd);
        if (el != nullptr)
            el->OnCommand(state);
    }
};