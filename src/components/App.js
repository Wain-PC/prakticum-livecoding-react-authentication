import React, {useCallback, useEffect, useState} from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import Login from './Login.js';
import Register from './Register.js';
import MyProfile from './MyProfile.js';
import ProtectedRoute from './ProtectedRoute';
import * as duckAuth from '../duckAuth.js';
import './styles/App.css';
import NavBar from "./NavBar";
import DuckList from "./DuckList";

const App = () => {
    const [userData, setUserData] = useState({
        username: '', email: ''
    })
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    const cbAuthenticate = useCallback((data) => {
        localStorage.setItem('jwt', data.jwt)
        setLoggedIn(true)
        setUserData(data.user);
    }, []);

    const cbLogin = useCallback(async ({username, password}) => {
        try {
            const data = await duckAuth.authorize(username, password);
            if (!data) throw new Error('Неверные имя пользователя или пароль')
            if (data.jwt) {
                cbAuthenticate(data);
            }
        } finally {
            setLoading(false)
        }

    }, [cbAuthenticate]);

    const cbRegister = useCallback(async ({username, password, email}) => {
        const res = await duckAuth.register({username, password, email});
        cbAuthenticate(res);
        return res;
    }, [cbAuthenticate]);

    const cbLogout = useCallback(() => {
        setLoggedIn(false);
        localStorage.removeItem('jwt');
    }, []);

    const cbTokenCheck = useCallback(async () => {
        try {
            let jwt = localStorage.getItem('jwt');
            if (!jwt) {
                throw new Error('no token');
            }
            const user = await duckAuth.getContent(jwt)
            if (user) {
                setLoggedIn(true)
                setUserData(user);
            }
        } catch {
        } finally {
            setLoading(false)
        }
    }, []);

    useEffect(() => {
        cbTokenCheck()
    }, [cbTokenCheck]);

    if (loading) {
        return '...Loading';
    }

    return (<div>
        {loggedIn ? <NavBar onLogOut={cbLogout}/> : null}
        <Switch>
            <ProtectedRoute path="/ducks" loggedIn={loggedIn} component={DuckList}/>
            <ProtectedRoute path="/my-profile" loggedIn={loggedIn} userData={userData} component={MyProfile}/>
            <Route path="/login">
                <Login isLoggedId={loggedIn} onLogin={cbLogin}/>
            </Route>
            <Route path="/register">
                <Register isLoggedId={loggedIn} onRegister={cbRegister}/>
            </Route>
            <Route>
                {loggedIn ? <Redirect to="/ducks"/> : <Redirect to="/login"/>}
            </Route>
        </Switch>
    </div>)
}

export default App;
