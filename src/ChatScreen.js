import React, {useEffect, useState, useRef} from "react";
import {
  AppBar,
  Backdrop,
  CircularProgress,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  List,
  TextField,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { useNavigate, useLocation } from "react-router-dom";
import { Send } from "@material-ui/icons";
import axios from "axios";
import ChatItem from "./ChatItem";
const { Client } = require('twilio-chat');

const ChatScreen = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [text, setText] = useState("")
    const [messages, setMessage] = useState([])
    const [loading, setLoading] = useState(false)
    const [channel, setChannel] = useState(null)
    const [token, setToken] = useState("")

    const scrollDiv = useRef()

    const [email, setEmail] = useState(location.state.email || "")
    const [room, setRoom] = useState(location.state.room || "")

    useEffect(async()=>{
      console.log(location,'===')
      if (!email || !room) {
        navigate("/");
      }
      
      setLoading(true)
      let token = await getToken(email)
      console.log(token, 'generated')
      setToken(token)
      clientStuff(token)

    },[])

    const joinChannel = async (channel) => {
      if (channel.channelState.status !== "joined") {
       await channel.join();
     }

     setChannel(channel)
     setLoading(false)
   
     channel.on("messageAdded", handleMessageAdded);
     scrollToBottom();
   };
   
   
   const handleMessageAdded = (message) => {
       setMessage((messages)=>[...messages, message])
       scrollToBottom()
   };
   
   const scrollToBottom = () => {
     const scrollHeight = scrollDiv.current.scrollHeight;
     const height = scrollDiv.current.clientHeight;
     const maxScrollTop = scrollHeight - height;
     scrollDiv.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
   };

   const getToken = async (email) => {
      const response = await axios.get(`http://localhost:5000/token/${email}`);
      const { data } = response;
      return data.token;
    }

    const sendMessage = () => {
      if (text) {
        setLoading(true)
        channel.sendMessage(String(text).trim());
        setText("")
        setLoading(false)
      }
    };

    const clientStuff = (token) => {
        const client = new Client(token);

        client.on('stateChanged', async(state) => {
          if (state === 'initialized') {
            // Use the client
            client.on("tokenAboutToExpire", async () => {
              const token = await getToken(email);
              client.updateToken(token);
          });
  
          client.on("tokenExpired", async () => {
              const token = await getToken(email);
              client.updateToken(token);
          });
  
          client.on("channelJoined", async (channel) => {
              // getting list of all messages since this is an existing channel
              const messages = await channel.getMessages();
              setMessage(messages.items)
              scrollToBottom();
            });
          
            try {
              const channel = await client.getChannelByUniqueName(room);
              joinChannel(channel);
            } catch(err) {
              try {
                const channel = await client.createChannel({
                  uniqueName: room,
                  friendlyName: room,
                });
            
                joinChannel(channel);
              } catch {
                throw new Error("Unable to create channel, please reload this page");
              }
            } 
          }
        })
    }

    return (
      <Container component="main" maxWidth="md">
        <Backdrop open={loading} style={{ zIndex: 99999 }}>
          <CircularProgress style={{ color: "white" }} />
        </Backdrop>
  
        <AppBar elevation={10}>
          <Toolbar>
            <Typography variant="h6">
              {`Room: ${room}, User: ${email}`}
            </Typography>
          </Toolbar>
        </AppBar>
  
        <CssBaseline />
  
        <Grid container direction="column" style={styles.mainGrid}>
          <Grid item style={styles.gridItemChatList} ref={scrollDiv}>
            <List dense={true}>
                {messages &&
                  messages.map((message) => 
                    <ChatItem
                      key={message.index}
                      message={message}
                      email={email}/>
                  )}
            </List>
          </Grid>
  
          <Grid item style={styles.gridItemMessage}>
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="center">
              <Grid item style={styles.textFieldContainer}>
                <TextField
                  required
                  style={styles.textField}
                  placeholder="Enter message"
                  variant="outlined"
                  multiline
                  rows={2}
                  value={text}
                  disabled={!channel}
                  onChange={(event) =>
                    setText(event.target.value)
                  }/>
              </Grid>
              
              <Grid item>
                <IconButton
                  style={styles.sendButton}
                  onClick={sendMessage}
                  disabled={!channel}>
                  <Send style={styles.sendIcon} />
                </IconButton>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    );

}

  const styles = {
    textField: { width: "100%", borderWidth: 0, borderColor: "transparent" },
    textFieldContainer: { flex: 1, marginRight: 12 },
    gridItem: { paddingTop: 12, paddingBottom: 12 },
    gridItemChatList: { overflow: "auto", height: "70vh" },
    gridItemMessage: { marginTop: 12, marginBottom: 12 },
    sendButton: { backgroundColor: "#3f51b5" },
    sendIcon: { color: "white" },
    mainGrid: { paddingTop: 100, borderWidth: 1 },
  };
  
  export default ChatScreen;