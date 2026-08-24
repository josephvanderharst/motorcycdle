#!/bin/sh

# Run this if you can natively
npm run build

# Otherwise, run this
# cmd.exe /C "npm run build"
# if [ $? -ne 0 ]; then
#   echo 'Error while building. Exiting...';
#   return 1;
# fi

rm -R ../dist-motorcycdle/src/assets
rm -R ../dist-motorcycdle/assets
rm ../dist-motorcycdle/*.*

cp -r dist/assets ../dist-motorcycdle/
cp dist/*.* ../dist-motorcycdle/
cp -r src/assets ../dist-motorcycdle/src/
