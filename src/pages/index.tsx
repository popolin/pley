import React from 'react'
import Head from 'next/head'

import RocketseatLogo from '../assets/rocketseat.svg'
import { Container } from '../styles/pages/Home'

const Home: React.FC = () => {
    return (
        <Container>
            <Head>
                <title>-- pley --</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <RocketseatLogo />
            <h1>Hello World!</h1>
        </Container>
    )
}
export default Home
