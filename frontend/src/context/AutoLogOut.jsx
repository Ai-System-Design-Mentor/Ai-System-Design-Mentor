import { useEffect, useRef } from "react";

export default function useAutoLogout(onLogout, timeout = 3000000) {
    const timer = useRef(null);

    const resetTimer = () => {
        if (timer.current) clearTimeout(timer.current);

        timer.current = setTimeout(() => {
            onLogout();
        }, timeout);
    };

    useEffect(() => {
        const events = ["mousemove", "keydown", "click"];

        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer();

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            clearTimeout(timer.current);
        };
    }, []);
}