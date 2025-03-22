import { Button, Input, Stack, Typography } from "@mui/joy";
import Header from "./components/Header";
import React from "react";
import { captureException } from "@sentry/nextjs";
import { GetServerSideProps, GetServerSidePropsContext } from "next";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const {adminToken} = ctx.req.cookies;

    if (adminToken) {
        return {
            redirect: {
                destination: '/spravce',
                permanent: false
            }
        }
    }

    return {
        props: {}
    }
}

export default function Login() {
    const [password, setPassword] = React.useState("");

    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    
    const login = () => {
        setLoading(true);
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: password
            })
        }).then(x => {
            setLoading(false);
            if (x.ok) {
                location.href = '/spravce';
            } else {
                captureException(x);
                x.json().then(y => {
                    setError(`Chyba při přihlášení: ${y.message}`);
                }).catch(x => {
                    captureException(x);
                    setError(`Chyba při přihlášení: ${x}`);
                });
            }
        }).catch(x => {
            setLoading(false);
            captureException(x);
            setError(`Chyba při přihlášení: ${x}`);
        });
    }

    return (
        <div className="w-2/3 m-auto">
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />

            <Stack gap={1}>
                <Typography level="h1" textAlign={"center"}>Administrace</Typography>

                <br />
                <Input type="password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} placeholder="Heslo" disabled={loading} />

                <Button onClick={login} disabled={loading}>Přihlásit se</Button>

                {error && <Typography color="danger">{error}</Typography>}
            </Stack>
            <Header />
        </div>
    )
}