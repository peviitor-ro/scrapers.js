#!/bin/bash

URL="https://api.laurentiumarian.ro/get_token"
EMAIL="laurentiumarianbaluta@gmail.com"


ACCESS_TOKEN=$(curl -X POST -H "Content-Type: application/json" -d '{"email": "'$EMAIL'"}' $URL)

export TOKEN=$(jq -r '.access' <<< $ACCESS_TOKEN)

echo $TOKEN

