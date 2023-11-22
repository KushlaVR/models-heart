// RoboconMotor.h
#pragma once

#include <Arduino.h>
#include <Servo.h>

class PhysicsEffects
{

private:
	long start = 0;

public:
	// Duration millisecond (1000 miliseconds = 1 second)
	long span = 0;
	long duration = 1000;
	long fullProgress = 1000;
	long halfProgress = 500;
	void begin();
	int softStart();
	int softEnd();
	int softStartSoftEnd();
};

class MotorBase
{
private:
	PhysicsEffects *effect;
	int etalonDuration = 3000;
	int targetSpeed = 0;
	int delta = 0;
	long weight = 10000;

	unsigned long startup = 0;
	
public:
	
	int startUpSpeed = 100;
	unsigned long startUpDuration = 0;


	int controllerType = 0;
	int factSpeed = 0;
	Print *responder = nullptr;
	String name = "";
	bool isEnabled = false;

	MotorBase(String name, PhysicsEffects *effect);
	~MotorBase(){};

	// Задати вагу механхму в грамах
	void setWeight(long weight);
	// задати цільову швидкість
	void setSpeed(int speed);
	void reset();

	void loop();
	virtual void write(int newSpeed);
};

class HBridge : public MotorBase
{
private:
	int pwmPin = 0;
	int motorPinA = 0;
	int motorPinB = 0;

public:
	HBridge(String name, int pwmPin, int reley1Pin, int reley2Pin, PhysicsEffects *effect);
	HBridge(String name, int pinA, int pinB, PhysicsEffects *effect);

	~HBridge(){};

	virtual void write(int newSpeed);
};

class SpeedController : public MotorBase
{

private:
	int pin;
	Servo *servo = nullptr;

public:
	SpeedController(String name, int pin, PhysicsEffects *effect);
	~SpeedController();

	virtual void write(int newSpeed);
};
