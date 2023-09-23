#pragma once
#include <WebUIController.h>


typedef void(*jsonFunctionPointer) (JsonString * json);
typedef void(*serverParameterFunctionPointer) (String name, String value);

class SetupController
{
public:
	SetupController();
	~SetupController();

	void setup();

	static void Setup_Get();
	static void Setup_Post();

	serverParameterFunctionPointer saveParameter = nullptr;
	jsonFunctionPointer saveConfig = nullptr;
	jsonFunctionPointer buildConfig = nullptr;
};


extern SetupController setupController;
