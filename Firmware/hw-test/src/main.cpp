#include <Arduino.h>
#include <Json.h>
#include <Motor.h>
#include <Blinker.h>
#include <board.h>

PowerManager powerManager(PIN_POWER_HOLD, PIN_POWER_SENSE, PIN_BATTERY_SENSE);
PhysicsEffects *motorPhysics = nullptr;
MotorBase *motor = nullptr;
unsigned long motorTestStart = 0;

Blinker *pinBlinker = nullptr;

int testNumber = 0;
int currentTestNumber = 0;

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
  Serial.println("Open Source Model's Heart - Harware Test");
  Serial.println("Wait until release power button.");
  powerManager.powerOn();
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("Power Manager is holding power On. You can releas power button.");
  digitalWrite(LED_BUILTIN, LOW);

  pinBlinker = new Blinker("blink");
  pinBlinker->console = &Serial;
  pinBlinker->debug = true;
  pinBlinker->Add(PIN_HEAD_LIGHT, 0, LOW);
  pinBlinker->Add(PIN_HEAD_LIGHT, 0, 255);
  pinBlinker->Add(PIN_HEAD_LIGHT, 500, LOW);
  pinBlinker->Add(PIN_HEAD_LIGHT, 1000, LOW);
}

void stopMotorTest()
{
  if (motor == nullptr)
    return;
  motor->reset();
  motor->loop();
}

void motorTest()
{
  if (motor == nullptr)
  {
    motorPhysics = new PhysicsEffects();
    motor = new HBridge("motor", PIN_MOTOR_A, PIN_MOTOR_B, motorPhysics);
    motor->isEnabled = true;
    motor->responder = &Serial;
    motor->setWeight(80000);
  }
  if ((millis() - motorTestStart) > 12000)
  {
    motorTestStart = millis();
  }
  else if ((millis() - motorTestStart) > 9000)
  {
    motor->setSpeed(0);
  }
  else if ((millis() - motorTestStart) > 6000)
  {
    motor->setSpeed(-255);
  }
  else if ((millis() - motorTestStart) > 3000)
  {
    motor->setSpeed(0);
  }
  else
  {
    motor->setSpeed(255);
  }
  motor->loop();
}

void stopBlinker()
{
  if (pinBlinker != nullptr)
    pinBlinker->end();
}

void startBlinker(int pin)
{
  if (!pinBlinker->isRunning())
  {
    pinMode(pin, OUTPUT);
    BlinkerItem *item = pinBlinker->item(0);
    while (item != nullptr)
    {
      item->pin = pin;
      item = item->next;
    }
    pinBlinker->begin();
  }
  pinBlinker->loop();
}
unsigned long lastBattaryTest = 0;

void testBatteryVoltage()
{
if ((millis() - lastBattaryTest) > 1000){
  lastBattaryTest = millis();
  Serial.printf("Battary ADC %i\n", powerManager.getBatteryADC());
}
}

void loop()
{
  powerManager.loop();
  if (currentTestNumber != testNumber)
  {
    switch (currentTestNumber)
    {
    case 1:
      stopMotorTest();
      break;
    case 2:
      stopBlinker();
      break;
    case 3:
      stopBlinker();
      break;
    case 4:
      stopBlinker();
      break;
    case 5:
      stopBlinker();
      break;
    case 6:
      break;
    default:
      break;
    }
  }
  currentTestNumber = testNumber;
  if (testNumber == 1)
  {
    motorTest();
  }
  if (testNumber == 2)
  {
    startBlinker(PIN_REVERSE_LIGHT);
  }
  if (testNumber == 3)
  {
    startBlinker(PIN_LEFT_TURN_LIGHT);
  }
  if (testNumber == 4)
  {
    startBlinker(PIN_RIGHT_TURN_LIGHT);
  }
  if (testNumber == 5)
  {
    startBlinker(PIN_HEAD_LIGHT);
  }
  if (testNumber == 6)
  {
    testBatteryVoltage();
  }
}
