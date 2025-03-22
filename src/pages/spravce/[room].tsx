import { Button, Stack, Table, Typography } from "@mui/joy";
import { PrismaClient } from "@prisma/client";
import { captureException } from "@sentry/nextjs";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next"
import { useRouter } from "next/router";
import React from "react";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const { room } = ctx.params as { room: string };

    if (isNaN(Number(room))) {
        return {
            redirect: {
                destination: '/spravce',
                permanent: false
            }
        }
    }

    if (!room) {
        return {
            redirect: {
                destination: '/spravce',
                permanent: false
            }
        }
    }

    const roomData = await prisma.rooms.findFirst({
        where: {
            id: Number(room)
        },
        include: {
            Presenters: true,
            Voters: true
        }
    });

    if (!roomData) {
        return {
            redirect: {
                destination: '/spravce',
                permanent: false
            }
        }
    }

    const anyonePresenting = roomData.Presenters.some(x => x.presenting);
    return {
        props: {
            room: {
                id: roomData.id,
                name: roomData.name,
                code: roomData.inviteCode,
                presenters: roomData.Presenters.map(x => ({
                    id: x.id,
                    idea: x.idea,
                    votingFinished: x.votingState === 2
                })),
                voters: roomData.Voters.map(x => ({
                    id: x.id,
                    username: x.username
                })),
                state: roomData.state,
                showNext: roomData.paused || !anyonePresenting
            }
        }
    }
}

export default function Room(params: InferGetServerSidePropsType<typeof getServerSideProps>) {

    const router = useRouter();

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (router.isReady) {
                router.replace(`/spravce/${params.room.id}`);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [router.isReady]);

    const goBack = () => {
        location.href = '/spravce';
    }

    const startRoom = () => {
        fetch('/api/startroom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: params.room.id
            })
        }).catch(x => {
            captureException(x);
        });
    }

    const unpauseRoom = () => {
        fetch('/api/unpauseroom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: params.room.id
            })
        }).catch(x => {
            captureException(x);
        });
    }

    const copyLink = () => {
        navigator.clipboard.writeText(`${location.protocol}//${location.host}#${params.room.code}`);
    }

    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        QRCode.toCanvas(canvasRef.current, `${location.protocol}//${location.host}#${params.room.code}`);
    }, [params.room.presenters]);

    return (
        <div className="w-2/3 m-auto">
            <Button onClick={goBack}>Zpět</Button>
            <Typography level="h1">Room: {params.room.name}</Typography>

            <Stack gap={1} direction={"row"}>
                {params.room.state === "starting" && <Button onClick={startRoom}>Start</Button>}
                {params.room.showNext && <Button onClick={unpauseRoom}>Další prezentující</Button>}
                <Button onClick={copyLink}>Kopírovat odkaz</Button>
            </Stack>

            <div>
                <canvas width={400} height={400} ref={canvasRef}></canvas>
            </div>
            
            <Typography level="h2">Prezentující</Typography>
            
            <Table>
                <thead>
                    <tr>
                        <th>Návrh</th>
                        <th>Dokončen</th>
                    </tr>
                </thead>
                <tbody>
                    {params.room.presenters.map(x => (
                        <tr key={x.id}>
                            <td>
                                <Typography>{x.idea}</Typography>
                            </td>
                            <td>
                                <Typography>{x.votingFinished ? 'Výsledek hlasování' : ''}</Typography>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Typography level="h2">Hlasující</Typography>

            <Table>
                <thead>
                    <tr>
                        <th>Uživatel</th>
                    </tr>
                </thead>
                <tbody>
                    {params.room.voters.map(x => (
                        <tr key={x.id}>
                            <td>
                                <Typography>{x.username}</Typography>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

        </div>
    )
}