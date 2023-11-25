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
    unsigned long voltageReadInterval = 300;
    int battery_adc_value = 0;
    double battery_percent = 0;

    bool powerButtonActivated = false;

    Button *powerButton = nullptr;

    void powerButtonPressed();
    void powerButtonHold();
    void powerButtonRelease();

    static void _powerButtonPressed(void *sender);
    static void _powerButtonHold(void *sender);
    static void _powerButtonRelease(void *sender);

public:
    double bat_adc_min = 700;
    double bat_adc_max = 1024;
    double bat_percent_critical = 20;

    PowerManager(int powerHoldPin, int powerSensePin, int battarySensePin);

    ~PowerManager() {}

    void begin();

    void loop();

    void powerOn();

    void powerOff();

    int getBatteryADC();

    double getBattaryPercent();
};
