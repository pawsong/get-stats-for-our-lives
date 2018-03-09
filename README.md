# get-stats-for-our-lives

This project provides an Amazon Web Services (AWS) lambda function that returns statistics on the March for Our Lives.  These statics include the number of petition signatories, the number of events taking place, and the aggregate total number of people signed up to march at the events.  The function provides a REST GET API.

The project is written in TypeScript for compilation to JavaScript.

## Installing dependencies
If you haven't already, install node.js on your machine.

Clone the repository from https://github.com/RagtagOpen/get-stats-for-our-lives.git

### If you use yarn, use it to install the project's dependencies.
```
yarn
```
### If you do not use yarn, install via Node Package Manager (npm).
```
npm install
```

## Compiling
Compile the typescript into javascript to build the contents of the `dist` directory.
```
node .\node_modules\typescript\bin\tsc
```

## Test
```
node .\dist\get-stats-for-our-lives.js
```
## Epilog
"And I would have gotten away with it too, if it weren't for you meddling kids!" -- Every villian on Scooby Doo, and soon the NRA as well.
