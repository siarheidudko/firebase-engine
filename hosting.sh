#!/bin/bash
MYHOSTDIRNAME="docs"
rm -rf $MYHOSTDIRNAME
node_modules/.bin/typedoc --entryPointStrategy expand src&&echo \"\">./docs/.nojekyll
rsync -ra hosting/ $MYHOSTDIRNAME
# echo "firebase-engine.ml">$MYHOSTDIRNAME/CNAME
echo "">$MYHOSTDIRNAME/.nojekyll
OLDTEXT="<meta name=\"description\" content=\"\">"
NEWTEXT=$(cat "hosting.html" | tr "\n" "\0")
find $MYHOSTDIRNAME -type f -name "*.html" -exec sed -i -e "s%$OLDTEXT%$NEWTEXT%g" {} +