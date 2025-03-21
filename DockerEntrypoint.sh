#!/bin/bash

if [[ ! -f /app/prisma/data/data.db ]]; then
    yarn prisma db push
fi

yarn start