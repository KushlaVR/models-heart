#include "PowerManager.h"

PowerManager::PowerManager(int powerHoldPin, int powerSensePin, int battarySensePin)
{
    this->powerHoldPin = powerHoldPin;
    this->powerSensePin = powerSensePin;
    this->batterySensePin = battarySensePin;
}

void PowerManager::begin()
{
    pinMode(batterySensePin, INPUT);

    pinMode(powerHoldPin, OUTPUT);
    pinMode(powerSensePin, INPUT_PULLUP);

    powerButton = new Button(powerSensePin, _powerButtonPressed, _powerButtonHold, _powerButtonRelease);
    powerButton->holdInterval = 2000;
    powerButton->tag = this;
    powerButton->condition = LOW;
    powerButton->isEnabled = true;
    powerButton->InitState();
    powerButton->handle();

    if (!powerButton->isPressed())
        this->powerButtonActivated = true;
}

void PowerManager::loop()
{
    unsigned long m = millis();
    powerButton->handle();
    if ((m - lastVoltageRead) > voltageReadInterval)
    {
        battery_adc_value = analogRead(batterySensePin);
        battery_percent = map(battery_adc_value, bat_adc_min, bat_adc_max, 0.0, 100.0);
        Serial.printf("battery_adc_value %i\n", battery_adc_value);
        if (battery_percent <= bat_percent_critical)
        {
            Serial.printf("battery charge critical value! %f\nPower down...\n", battery_percent);
            powerOff();
        }
        lastVoltageRead = m;
    }
}

void PowerManager::powerOn()
{
    digitalWrite(powerHoldPin, HIGH);
}

void PowerManager::powerOff()
{
    digitalWrite(powerHoldPin, LOW);
    delay(5000);
    ESP.restart();
}

int PowerManager::getBatteryADC()
{
    return battery_adc_value;
}

void PowerManager::powerButtonPressed()
{
    if (OnPowerPress != nullptr)
        OnPowerPress(this);
}

void PowerManager::powerButtonHold()
{
    if (powerButtonActivated)
    {
        if (OnPowerOff != nullptr)
            OnPowerOff(this);
        powerOff();
    }
}

void PowerManager::powerButtonRelease()
{
    powerButtonActivated = true;
}

void PowerManager::_powerButtonPressed(void *sender)
{
    ((PowerManager *)(((Button *)sender)->tag))->powerButtonPressed();
}

void PowerManager::_powerButtonHold(void *sender)
{
    ((PowerManager *)(((Button *)sender)->tag))->powerButtonHold();
}

void PowerManager::_powerButtonRelease(void *sender)
{
    ((PowerManager *)(((Button *)sender)->tag))->powerButtonRelease();
}

double PowerManager::getBattaryPercent()
{
    return battery_percent;
}
