import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {SessionList} from "../../im/session_list";
import {Account} from "../../im/account";

function useSession() {

    const {sid} = useParams<{ sid: string }>();
    const [session, setSession] = useState(Account.session().get(sid))

    useEffect(() => {
        Account.session().setSelectedSession(sid)
        setSession(Account.session().get(sid))
    }, [sid])

    return session
}

export default useSession