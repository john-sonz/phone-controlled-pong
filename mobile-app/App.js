import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, BackHandler } from 'react-native';
import { ScreenOrientation } from 'expo';
import { Accelerometer } from 'expo-sensors';
import Prompt from 'react-native-input-prompt';

const ws = new WebSocket("ws://192.168.8.100:1337");

export default class AccelerometerSensor extends React.Component {
    state = {
        accelerometerData: {},
        sending: false,
        subscribed: true,
        prompt: true,
        text: "",
        color: null
    }

    componentDidMount() {
        this._toggle();
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    connect = (addr) => {
        this._ws = new WebSocket(`ws://${addr}:1337`);
        this._ws.onerror = () => {
            this.setState({ prompt: true, sending: false });
        }
        this._ws.onopen = (e) => {
            this._ws.send(JSON.stringify(
                { type: "open", device: "phone" }
            ))
        }
        this._ws.onmessage = (m) => {
            const data = JSON.parse(m.data);
            if (data.type == "open") {
                this.setState({ text: "Player " + data.color, color: data.color, sending: true });
            }
        }
        this.setState({ prompt: false });
    }

    _toggle = () => {
        if (this._subscription) {
            this._unsubscribe();
        } else {
            this._subscribe();
        }
    }

    _toggleServer = () => {
        this.setState({ sending: !this.state.sending })
    }

    _subscribe = () => {
        this._subscription = Accelerometer.addListener(accelerometerData => {
            this.sendData(accelerometerData);
            this.setState({ accelerometerData });
        });
        this.setState({ subscribed: true });
    }

    sendData = (data) => {
        if (!this.state.sending) return;
        this._ws.send(JSON.stringify({ type: "move", device: "phone", color: this.state.color, ...data }));
    }

    _unsubscribe = () => {
        this._subscription && this._subscription.remove();
        this._subscription = null;
        this.setState({ subscribed: false });
    }

    render() {
        let { x, y, z } = this.state.accelerometerData;

        return (
            <View style={styles.cont}>
                <Prompt visible={this.state.prompt}
                    title="Enter WebSocket server address"
                    placeholder="i.e. 192.168.0.1"
                    onCancel={BackHandler.exitApp}
                    onSubmit={this.connect}
                />
                <TouchableOpacity style={[styles.buttons, { backgroundColor: this._subscription ? "green" : "red" }]} onPress={this._toggle}>
                    <Text style={{ textAlign: 'center', fontSize: 20 }}>
                        Accelerometer On/Off
                    </Text>
                </TouchableOpacity>
                <View style={{ width: 200 }}>
                    <Text style style={{ textAlign: 'center', fontSize: 20, color: this.state.color }}>{this.state.text}</Text>
                    <Text style={{ textAlign: 'center', fontSize: 20 }}>x: {round(x)} y: {round(y)} z: {round(z)}</Text>
                </View>
                <TouchableOpacity style={[styles.buttons, { backgroundColor: this.state.sending ? "green" : "red" }]} onPress={this._toggleServer}>
                    <Text style={{ textAlign: 'center', fontSize: 20 }}>
                        Send to server On/Off
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }
}

function round(n) {
    if (!n) {
        return 0;
    }

    return Math.floor(n * 100) / 100;
}

const buttonSize = 150

const styles = StyleSheet.create({
    cont: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttons: {
        width: buttonSize,
        height: buttonSize,
        borderRadius: buttonSize / 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 30,
    }
});

