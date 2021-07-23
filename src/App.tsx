import React, {useState} from 'react';
import './App.css';
import {Container, Grid} from "@material-ui/core";
import {ChatComp} from "./component/Room";
import {Bar} from "./component/Bar";
import {ChatList} from "./component/ChatList";
import {ChatContext, DefaultConfig} from "./component/context";

function App() {

    const [selectedUid, setUid] = useState(-1)

    return (
        <div className="App">
            <Container color={"text.disabled"} style={{height: "100vh"}}>
                <Grid container color={"text.disabled"} style={{height: "100vh", width: "1000px", margin: "auto"}}
                      alignItems={"center"}>
                    <ChatContext.Provider   value={DefaultConfig}>
                        <Grid alignItems={"center"} container style={{boxShadow: "grey 6px 7px 15px 0px"}}>
                            <Grid item md={4} style={{borderRight: "#ccc 2px solid"}}>
                                <Grid container>
                                    <Grid item md={2} xs={4} style={{height: "700px"}}>
                                        <Bar/>
                                    </Grid>
                                    <Grid item md={10} xs={8} style={{height: "700px"}}>
                                        <ChatList onSelectUser={(uid) => {
                                            setUid(uid)
                                        }}/>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid item md={8} style={{height: "700px"}}>
                                <ChatComp uid={selectedUid}/>
                            </Grid>
                        </Grid>
                    </ChatContext.Provider>
                </Grid>
            </Container>
        </div>
    );
}

export default App;
