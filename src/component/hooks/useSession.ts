import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {SessionList} from "../../im/session_list";

function useSession() {

    const {sid} = useParams<{ sid: string }>();
    const [session, setSession] = useState(SessionList.getInstance().get(sid))

    useEffect(() => {
        SessionList.getInstance().setSelectedSession(sid)
        setSession(SessionList.getInstance().get(sid))
    }, [sid])

    return session
}

export default useSession