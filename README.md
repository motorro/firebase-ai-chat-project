# Firebase AI chat
This is a sample project for the [firebase-ai-chat](https://github.com/motorro/firebase-ai-chat) library.
Take a look at the library docs for the descriptions.

The project runs OpenAI assistant chats on Firebase
![Component diagram](http://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/motorro/firebase-openai-chat-project/master/readme/components.puml)

To run the project:
- Create an [OpenAI](https://platform.openai.com/apps)
- Create a sample Assistant. The assistant prompt and tools definitions may be created by this [script](Firebase/assistant/src/createCalculatorAssistant.ts)
- Set up your own Firebase project with:
  - Auth
  - Firestore
  - Cloud functions
- Enable VertexAI API in your Firebase project
- Put `.firebaserc` to project directory
- Check `firestore.rules`
- Check `firestore.indexes.json`
- Setup `OPENAI_API_KEY` and `OPENAI_ASSISTANT_ID` variables as described in [Configure your environment](https://firebase.google.com/docs/functions/config-env)
- Deploy the project
- Build the [client application](Client)
