import { Button, Slider, Stack, Table, Typography } from "@mui/joy";
import { PrismaClient } from "@prisma/client";
import { captureException } from "@sentry/nextjs";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next"
import { useRouter } from "next/router";
import React from "react";
import QRCode from "qrcode";
import { intervalToDuration } from "date-fns";

const prisma = new PrismaClient();

async function getBestPresenters(id: number) {
    const bestPresenters = await prisma.presenters.findMany({
        where: {
            joinedRoomId: id
        },
        include: {
            Votes: true,
        },
    });

    const rankedPresenters = bestPresenters.map((presenter) => {
        const totalVotes = presenter.Votes.length || 1;
        return {
            id: presenter.id,
            username: presenter.username,
            idea: presenter.idea,
            prinosnost: presenter.Votes.reduce((acc, v) => acc + v.prinosnost, 0) / totalVotes,
            kreativita: presenter.Votes.reduce((acc, v) => acc + v.kreativita, 0) / totalVotes,
            uskutecnost: presenter.Votes.reduce((acc, v) => acc + v.uskutecnost, 0) / totalVotes,
        };
    });

    return {
        bestByPrinosnost: [...rankedPresenters].sort((a, b) => b.prinosnost - a.prinosnost),
        bestByKreativita: [...rankedPresenters].sort((a, b) => b.kreativita - a.kreativita),
        bestByUskutecnost: [...rankedPresenters].sort((a, b) => b.uskutecnost - a.uskutecnost),
    };
}


export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const { adminToken } = ctx.req.cookies;

    if (!adminToken) {
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        }
    }

    if (adminToken !== 'Think_diff3r3nt_Admin') {
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        }
    }

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

    const presenter = await prisma.presenters.findFirst({
        where: {
            joinedRoomId: Number(room),
            OR: [
                { votingState: 1 },
                { presenting: true }
            ]
        }
    });

    let summary = null as {
        bestByPrinosnost: {
            id: number;
            username: string;
            idea: string;
            prinosnost: number;
            kreativita: number;
            uskutecnost: number;
        }[];
        bestByKreativita: {
            id: number;
            username: string;
            idea: string;
            prinosnost: number;
            kreativita: number;
            uskutecnost: number;
        }[];
        bestByUskutecnost: {
            id: number;
            username: string;
            idea: string;
            prinosnost: number;
            kreativita: number;
            uskutecnost: number;
        }[];
    } | null;

    if (!presenter) {
        summary = await getBestPresenters(roomData.id);
    }

    const anyonePresenting = roomData.Presenters.some(x => x.presenting);
    return {
        props: {
            room: {
                id: roomData.id,
                name: roomData.name,
                code: roomData.inviteCode,
                presenters: roomData.Presenters.map(x => {
                    const a = intervalToDuration({ start: x.presentationStart ?? new Date(), end: x.presentationEnd ?? new Date() })
                    return {
                        id: x.id,
                        idea: x.idea,
                        votingFinished: x.votingState === 2,
                        presenting: x.presenting,
                        duration: `${(a.minutes ?? 0).toString().padStart(2, '0')}:${(a.seconds ?? 0).toString().padStart(2, '0')}`
                    }
                }),
                voters: roomData.Voters.map(x => ({
                    id: x.id,
                    username: x.username
                })),
                state: roomData.state,
                showNext: roomData.paused || !anyonePresenting
            },
            summary: summary ?? null
        }
    }
}

export default function Room(params: InferGetServerSidePropsType<typeof getServerSideProps>) {

    const [showQR, setShowQR] = React.useState(false);

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
        if (showQR) {
            QRCode.toCanvas(canvasRef.current, `${location.protocol}//${location.host}#${params.room.code}`);
        }
    }, [params.room.presenters]);

    return (
        <div className="w-2/3 m-auto">
            <Button onClick={goBack}>Zpět</Button>
            <Typography level="h1">Room: {params.room.name}</Typography>

            <Stack gap={1} direction={"row"}>
                {params.room.state === "starting" && <Button onClick={startRoom}>Start</Button>}
                {params.room.showNext && <Button onClick={unpauseRoom}>Další prezentující</Button>}
                <Button onClick={copyLink}>Kopírovat odkaz</Button>
                <Button onClick={() => setShowQR(true)}>Zobrazit QR kód</Button>
            </Stack>

            {showQR && <div>
                <canvas width={400} height={400} ref={canvasRef}></canvas>
            </div>}
            
            {params.summary && params.summary.bestByPrinosnost && params.summary.bestByKreativita && params.summary.bestByUskutecnost &&
            params.summary.bestByUskutecnost.length > 0 && params.summary.bestByKreativita.length > 0 && params.summary.bestByPrinosnost.length > 0 && <Stack gap={1}>
                <Typography level="h3">Přínosnost</Typography>
                <Typography>{params.summary.bestByPrinosnost[0].idea} - {params.summary.bestByPrinosnost[0].username}</Typography>
                <Slider value={params.summary.bestByPrinosnost[0].prinosnost} min={1} max={6} marks={[{ value: 1, label: 'Špatný' }, { value: 6, label: 'Dobrý' }]}></Slider>
                <Typography level="h3">Kreativita</Typography>
                <Typography>{params.summary.bestByKreativita[0].idea} - {params.summary.bestByKreativita[0].username}</Typography>
                <Slider value={params.summary.bestByKreativita[0].kreativita} min={1} max={6} marks={[{ value: 1, label: 'Špatný' }, { value: 6, label: 'Dobrý' }]}></Slider>
                <Typography level="h3">Uskutečnitelnost</Typography>
                <Typography>{params.summary.bestByUskutecnost[0].idea} - {params.summary.bestByUskutecnost[0].username}</Typography>
                <Slider value={params.summary.bestByUskutecnost[0].uskutecnost} min={1} max={6} marks={[{ value: 1, label: 'Špatný' }, { value: 6, label: 'Dobrý' }]}></Slider>
            </Stack>}

            <Typography level="h2">Prezentující ({params.room.presenters.length})</Typography>

            <Table>
                <thead>
                    <tr>
                        <th>Návrh</th>
                        <th>Dokončen</th>
                        <th>Čas prezentace</th>
                    </tr>
                </thead>
                <tbody>
                    {params.room.presenters.map(x => (
                        <tr key={x.id}>
                            <td>
                                <Typography>{x.idea}</Typography>
                            </td>
                            <td>
                                <Typography>{x.votingFinished ? 'Dokončil' : x.presenting ? 'Prezentuje' : ''}</Typography>
                            </td>
                            <td>
                                <Typography>{x.duration}</Typography>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Typography level="h2">Hlasující ({params.room.voters.length})</Typography>

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