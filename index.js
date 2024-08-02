import EventSource from "react-native-sse";

import "react-native-url-polyfill/auto";

const OPENAI_KEY = "<your-openai-api-key>";
const [messages, setMessages] = useState([]);

let handleSubmitPrompt = async (list) => {
  let newContent = "";

  if (list.length > 0) {
    let url = "https://api.openai.com/v1/chat/completions";

    // Parameters to pass to the API
    let data = {
      model: "gpt-3.5-turbo",
      messages: list,
      temperature: 0.75,
      top_p: 0.95,
      max_tokens: 100,
      stream: true,
      n: 1,
      max_tokens: 200,
    };

    //Initiate the requests
    const es = new EventSource(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      method: "POST",
      body: JSON.stringify(data),
      pollingInterval: 25000,
    });

    //Add the last message to the list
    const message = {
      _id: new Date().getTime(),
      text: " >",
      createdAt: new Date(),
    };

    setMessages((previousMessages) => [...previousMessages, message]);

    // Listen the server until the last piece of text
    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.");
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          // get every piece of text
          const data = JSON.parse(event.data);
          const delta = data.choices[0].delta;

          // Check if is the last text to close the events request
          const finish_reason = data.choices[0].finish_reason;

          if (finish_reason === "stop") {
            es.close();
          } else {
            if (delta && delta.content) {
              // Update content with new data
              newContent = newContent + delta.content;

              // Continuously update the last message in the state
              // with new piece of data
              setMessages((previousMessages) => {
                // Get the last array
                const last = [...previousMessages];

                // Update the list
                const mewLIst = last.map((m, i) => {
                  if (m._id === message_._id) m.text = newContent;

                  return m;
                });
                // Return the new array
                return mewLIst;
              });
            }
          }
        } else {
          es.close();
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message);
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error);
      }
    };

    // Add listener
    es.addEventListener("open", listener);
    es.addEventListener("message", listener);
    es.addEventListener("error", listener);

    return () => {
      es.removeAllEventListeners();
      es.close();
    };
  } else {
    console.error("Please insert a prompt!");
  }
};
