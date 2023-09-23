#pragma once

#include <Arduino.h>
#include <Button.h>

#define PIN_REVERSE_LIGHT 0
#define PIN_HEAD_LIGHT 2
#define PIN_RIGHT_TURN_LIGHT 4
#define PIN_LEFT_TURN_LIGHT 5
#define PIN_MOTOR_A 12
#define PIN_MOTOR_B 13
#define PIN_SERVO 14
#define PIN_POWER_HOLD 15
#define PIN_POWER_SENSE 16
#define PIN_BATTERY_SENSE A0

class PowerManager
{
public:
    void (*OnPowerPress)(void *sender) = nullptr;
    void (*OnPowerOff)(void *sender) = nullptr;

private:
    int powerHoldPin;
    int powerSensePin;
    int batterySensePin;

    unsigned long lastVoltageRead = 0;
    unsigned long voltageReadInterval = 1000;
    int battery_adc_value = 0;
    bool buttoneWasReleasedAtLeasOnce = false;

    Button *powerButton = nullptr;

    void powerButtonPressed()
    {
        if (OnPowerPress != nullptr)
            OnPowerPress(this);
    }

    void powerButtonHold()
    {
        if (buttoneWasReleasedAtLeasOnce)
        {
            if (OnPowerOff != nullptr)
                OnPowerOff(this);
            powerOff();
        }
    }

    void powerButtonRelease()
    {
        buttoneWasReleasedAtLeasOnce = true;
    }

    static void _powerButtonPressed(void *sender)
    {
        ((PowerManager *)(((Button *)sender)->tag))->powerButtonPressed();
    }
    static void _powerButtonHold(void *sender)
    {
        ((PowerManager *)(((Button *)sender)->tag))->powerButtonHold();
    }
    static void _powerButtonRelease(void *sender)
    {
        ((PowerManager *)(((Button *)sender)->tag))->powerButtonRelease();
    }

public:
    PowerManager(int powerHoldPin, int powerSensePin, int battarySensePin)
    {
        this->powerHoldPin = powerHoldPin;
        this->powerSensePin = powerSensePin;
        this->batterySensePin = battarySensePin;
    }

    ~PowerManager() {}

    void begin()
    {
        pinMode(batterySensePin, INPUT);
        
        pinMode(powerHoldPin, OUTPUT);
        pinMode(powerSensePin, INPUT_PULLUP);

        powerButton = new Button(powerSensePin, _powerButtonPressed, _powerButtonHold, _powerButtonRelease);
        powerButton->holdInterval = 2000;
        powerButton->tag = this;
        powerButton->condition = LOW;
        powerButton->isEnabled = true;
    }

    void loop()
    {
        unsigned long m = millis();
        powerButton->handle();
        if ((m - lastVoltageRead) > voltageReadInterval)
        {
            battery_adc_value = analogRead(batterySensePin);
            lastVoltageRead = m;
        }
    }

    void powerOn()
    {
        digitalWrite(powerHoldPin, HIGH);
    }

    void powerOff()
    {
        digitalWrite(powerHoldPin, LOW);
        delay(5000);
        ESP.restart();
    }

    int getBatteryADC()
    {
        return battery_adc_value;
    }
};