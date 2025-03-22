import { Button, Checkbox, Input, Modal, ModalClose, ModalDialog, Slider, Stack, Typography } from "@mui/joy";
import { PrismaClient } from "@prisma/client";
import { captureException } from "@sentry/nextjs";
import { InferGetServerSidePropsType } from "next";
import React from "react";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Header from "./components/Header";

const prisma = new PrismaClient();

export async function getServerSideProps() {

  const messages = (await prisma.messages.findMany()).map(x => ({ username: x.username, message: x.message }));
  return {
    props: {
      messages
    }
  }
}

function PageEnterCode(props: {
  setPage: (page: string) => void;
  setCode: (code: string) => void;
}) {

  const validateCode = () => {
    if (enteredCode.length > 6) {
      setEnteredCode(enteredCode.slice(0, 6));
    }

    const regex = /^[1-9]{6}$/;
    return regex.test(enteredCode);
  }

  const [enteredCode, setEnteredCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const next = () => {

    setLoading(true);
    fetch('/api/verifycode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: enteredCode
      })
    }).then(x => {
      if (x.ok) {
        props.setPage("username");
        props.setCode(enteredCode);
        localStorage.setItem('code', enteredCode);
        setLoading(false);
      } else {
        setError('Neplatný kód');
        setLoading(false);
        captureException(x);
      }
    }).catch(x => {
      setError('Neplatný kód');
      setLoading(false);
      captureException(x);
    });
  }

  return <Stack gap={1}>
    <Typography>Kód hlasování</Typography>
    <Input value={enteredCode} onChange={(e) => setEnteredCode(e.currentTarget.value)} error={!validateCode() || loading} placeholder="123456" />
    <Button disabled={!validateCode() || loading} onClick={next}>Další</Button>
    {error && <Typography color="danger">{error}</Typography>}
  </Stack>
}

function PageEnterUserDetails(props: {
  setPage: (page: string) => void;
  setUsername: (username: string) => void;
  code: string;
}) {

  const [username, setUsername] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const next = () => {
    if (creatingPlan) {
      props.setPage("presenter");
      return;
    }
    props.setUsername(username);

    fetch('/api/joinuser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: props.code,
        username: username
      })
    }).then(x => {
      if (x.ok) {
        x.json().then(y => {
          props.setUsername(username);
          props.setPage("voting");
          localStorage.setItem('username', username);
        }).catch(x => {
          captureException(x);
        });
      } else {
        setError('Neplatný kód');
        setLoading(false);
        captureException(x);
      }
    }).catch(x => {
      setError('Neplatný kód');
      setLoading(false);
      captureException(x);
    });
  }

  return <Stack gap={1}>
    <Typography>Uživatelské jméno</Typography>
    <Input value={username} onChange={(e) => {
      setUsername(e.currentTarget.value);
      props.setUsername(e.currentTarget.value);
    }} disabled={loading} />
    <Stack gap={1} direction={"row"}>
      <Checkbox checked={creatingPlan} onChange={(e) => setCreatingPlan(e.currentTarget.checked)} disabled={loading}></Checkbox>
      <Typography>Chci prezentovat</Typography>
      {error && <Typography color="danger">{error}</Typography>}
    </Stack>
    <Button disabled={loading} onClick={next}>{creatingPlan ? 'Další' : "Připojit"}</Button>
  </Stack>
}

function PageEnterPresenterDetails(props: {
  setPage: (page: string) => void;
  code: string;
  username: string;
}) {
  const [idea, setIdea] = useState("");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitIdea = () => {
    fetch('/api/addpresenter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: props.code,
        username: props.username,
        idea: idea
      })
    }).then(x => {
      if (x.ok) {
        x.json().then(y => {
          props.setPage("voting");
        }).catch(x => {
          captureException(x);
        });
      } else {
        setError('Neplatný kód');
        setLoading(false);
        captureException(x);
      }
    }).catch(x => {
      setError('Neplatný kód');
      setLoading(false);
      captureException(x);
    });
  }

  return <Stack gap={1}>
    <Typography>Váš nápad</Typography>
    <Input value={idea} onChange={(e) => setIdea(e.currentTarget.value)} disabled={loading} />
    <Button onClick={submitIdea} disabled={loading}>Připojit se</Button>
    {error && <Typography color="danger">{error}</Typography>}
  </Stack>
}

function PageVoting(props: {
  setPage: (page: string) => void;
  code: string;
  username: string;
}) {

  const [hasPresenter, setHasPresenter] = useState(false);
  const [showPresentingOptions, setShowPresentingOptions] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [presentingUsername, setPresentingUsername] = useState("");
  const [votingBegan, setVotingBegan] = useState(false);
  const [votingFinished, setVotingFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [presentingFinished, setPresentingFinished] = useState(false);

  const [bestPrinosnost, setBestPrinosnost] = useState<{username: string, idea: string, value: number} | undefined>(undefined);
  const [bestKreativita, setBestKreativita] = useState<{username: string, idea: string, value: number} | undefined>(undefined);
  const [bestUskutecnost, setBestUskutecnost] = useState<{username: string, idea: string, value: number} | undefined>(undefined);

  const [prinosnost, setPrinosnost] = useState(1);
  const [kreativita, setKreativita] = useState(1);
  const [uskutecnost, setUskutecnost] = useState(1);

  const [hasVoted, setHasVoted] = useState(false);

  const [loading, setLoading] = useState(false);

  const [duration, setDuration] = useState("");

  const refresh = () => {
    fetch('/api/getcurrent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: props.code,
        username: props.username
      })
    }).then(x => {
      if (x.ok) {
        x.json().then(y => {
          console.log(y);
          try {

            setHasPresenter('voting' in y);
            setShowPresentingOptions(y.current?.presenting);
            setPresenting(y.current?.presenting);
            setPresentingUsername(y.current?.presentingUsername);
            setPresentingFinished(y.current?.presentingFinished);
            setVotingBegan(y.current?.votingBegan);
            setVotingFinished('finished' in y);
            setPaused('paused' in y);
            setDuration(y.current?.duration);
            setHasVoted(y.current?.voted);

            if (y.prinosnost) {
              setBestPrinosnost({
                username: y.prinosnost.username,
                idea: y.prinosnost.idea,
                value: y.prinosnost.prinosnost
              });
            }
            if (y.kreativita) {
              setBestKreativita({
                username: y.kreativita.username,
                idea: y.kreativita.idea,
                value: y.kreativita.kreativita
              });
            }
            if (y.uskutecnost) {
              setBestUskutecnost({
                username: y.uskutecnost.username,
                idea: y.uskutecnost.idea,
                value: y.uskutecnost.uskutecnost
              });
            }
          }
          catch (e) {
            console.log(e);
            captureException(e);
          }
        }).catch(x => {
          captureException(x);
        });
      } else {
        setHasPresenter(false);
      }
    })
  }


  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const sendVote = () => {
    fetch('/api/uservote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: props.code,
        username: props.username,
        prinosnost,
        kreativita,
        uskutecnost
      })
    }).then(x => {
      if (x.ok) {
        x.json().then(y => {
          setHasVoted(true);
        }).catch(x => {
          captureException(x);
        });
      } else {
        setLoading(false);
        captureException(x);
      }
    }).catch(x => {
      setLoading(false);
      captureException(x);
    });
  }

  const beginVoting = () => {
    fetch('/api/beginvoting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: props.code,
        username: props.username
      })
    }).then(x => {
      if (x.ok) {
        x.json().then(y => {
          setHasVoted(true);
        }).catch(x => {
          captureException(x);
        });
      } else {
        setLoading(false);
        captureException(x);
      }
    }).catch(x => {
      setLoading(false);
      captureException(x);
    });
  }

  const endVoting = () => {
    fetch('/api/endpresenting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: props.code,
        username: props.username
      })
    }).then(x => {
      if (x.ok) {
        x.json().then(y => {
          setHasVoted(false);
        }).catch(x => {
          captureException(x);
        });
      } else {
        setLoading(false);
        captureException(x);
      }
    }).catch(x => {
      setLoading(false);
      captureException(x);
    });
  }

  if (votingFinished) {
    return <>
      <Typography level="h2" textAlign={"center"}>Nejlepší návrhy</Typography>
      <br />
      <Stack gap={1}>
        <Typography level="h3">Přínosnost</Typography>
        <Typography>{bestPrinosnost?.idea} - {bestPrinosnost?.username}</Typography>
        <Slider  value={bestPrinosnost?.value} min={1} max={6} marks={[{value: 1, label: 'Špatný'}, {value: 6, label: 'Dobrý'}]}></Slider>
        <br />
        <Typography level="h3">Kreativita</Typography>
        <Typography>{bestKreativita?.idea} - {bestKreativita?.username}</Typography>
        <Slider  value={bestKreativita?.value} min={1} max={6} marks={[{value: 1, label: 'Špatný'}, {value: 6, label: 'Dobrý'}]}></Slider>
        <br />
        <Typography level="h3">Uskutečnitelnost</Typography>
        <Typography>{bestUskutecnost?.idea} - {bestUskutecnost?.username}</Typography>
        <Slider value={bestUskutecnost?.value} min={1} max={6} marks={[{value: 1, label: 'Špatný'}, {value: 6, label: 'Dobrý'}]}></Slider>
        <br />
        <Button onClick={() => {
          localStorage.removeItem('code');
          localStorage.removeItem('username');
          location.href = '/';
        }}>Zpět</Button>
      </Stack>
    </>
  }

  const leaveUser = () => {
    fetch('/api/leavevoting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: props.code,
        username: props.username
      })
    }).then(x => {
      if (x.ok) {
        x.json().then(y => {
          localStorage.removeItem('code');
          localStorage.removeItem('username');
          location.href = '/';
        }).catch(x => {
          captureException(x);
        });
      } else {
        captureException(x);
      }
    }).catch(x => {
      captureException(x);
    });
  }

  if (paused) {
    return <>
      <Typography>Hlasování ještě nezačalo</Typography>
    </>
  }

  if (!hasPresenter) {
    return <Stack gap={1}>
      <Typography>Čekání na začátek hlasování</Typography>
      <Button color="danger" onClick={leaveUser}>Odejít</Button>
    </Stack>
  }

  if (presenting) {
    if (presentingFinished) {
      return <Typography>Hlasování bylo dokončeno</Typography>
    }

    if (showPresentingOptions) {
      let color = (votingBegan ? "danger" : "success") as 'danger' | 'success';
      let text = votingBegan ? "Ukončit prezentaci" : "Spustit prezentování";
      return <>
        <Typography>Právě prezentujete návrh</Typography>
        {votingBegan && <Typography textAlign="right">{duration}</Typography>}
        <Button color={color} onClick={votingBegan ? endVoting : beginVoting}>{text}</Button>
      </>
    }
    else {
      return <Typography>
        Doreprezentovali jste
      </Typography>
    }
  }
  else {
    if (hasVoted) {
      return <Typography>Čekání na dalšího prezentujícího</Typography>
    }

    if (votingBegan) {
      return <>
        <Typography>Právě prezentuje: {presentingUsername}</Typography>
        <br />
        <Typography>Přínosnost:</Typography>
        <Slider disabled={loading} step={1} min={1} max={6} value={prinosnost} onChange={(e, x) => setPrinosnost(x as number)}
          marks={[{value: 1, label: 'Špatný'}, {value: 6, label: 'Dobrý'}]}></Slider>
        <Typography>Kreativita:</Typography>
        <Slider disabled={loading} step={1} min={1} max={6} value={kreativita} onChange={(e, x) => setKreativita(x as number)}
          marks={[{value: 1, label: 'Špatný'}, {value: 6, label: 'Dobrý'}]}></Slider>
        <Typography>Uskutečnitelnost:</Typography>
        <Slider disabled={loading} step={1} min={1} max={6} value={uskutecnost} onChange={(e, x) => setUskutecnost(x as number)}
          marks={[{value: 1, label: 'Špatný'}, {value: 6, label: 'Dobrý'}]}></Slider>

        <Button onClick={sendVote} disabled={loading}>Hlasovat</Button>
      </>
    }

    return <Typography>Hlasování ještě nezačalo</Typography>
  }
}

export default function MainPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [page, setPage] = useState("code");

  const [code, setCode] = useState('');
  const [username, setUsername] = useState("");

  const hasRan = React.useRef(false);

  React.useEffect(() => {
    if (!hasRan.current) {
      hasRan.current = true;
      if (localStorage.getItem('code') && localStorage.getItem('username')) {
        setPage("voting");
        setCode(localStorage.getItem('code') as string);
        setUsername(localStorage.getItem('username') as string);
      }

      if (location.hash.length === 7 && location.hash.slice(1).match(/^[1-9]{6}$/)) {
        setCode(location.hash.slice(1));
        setPage("username");
      }
    }
  }, []);

  return (
    <div className="w-2/3 m-auto">
      <br />
      <br />
      <br />

      {page === "code" && <>
        <br /><br /><br />
        <PageEnterCode setPage={setPage} setCode={setCode} />
      </>}
      {page === "username" && <>
        <br /><br /><br />
        <PageEnterUserDetails setPage={setPage} setUsername={setUsername} code={code} />
      </>}
      {page === "presenter" && <>
        <br /><br /><br />
        <PageEnterPresenterDetails setPage={setPage} code={code} username={username} />
      </>}
      {page === "voting" && <>
        <br /><br /><br />
        <PageVoting setPage={setPage} code={code} username={username} />
      </>}

      <Header />
    </div>
  );
}
