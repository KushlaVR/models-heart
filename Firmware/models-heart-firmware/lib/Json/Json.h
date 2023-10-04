// Json.h

#ifndef _JSON_h
#define _JSON_h

#include <Arduino.h>

class JsonString : public String
{
public:
	JsonString(const char *cstr = "");
	void appendComa();
	void AddValue(String name, String value);
	void beginObject();
	void endObject();
	void beginArray(String arrayName);
	void endArray();
	bool containsKey(char *key);
	String getValue(char *key);
	int getInt(char *key);
};

#endif
