#!/usr/bin/env node

import fetch from "node-fetch";
import { parse } from "node-html-parser";
import isAbsolute from "is-absolute-url";
import join from 'url-join'
import ora from 'ora'
import UserAgent from "user-agents";
import Headers from "fetch-headers";

const checklink = async (url) => {
    const userAgent = new UserAgent();

    const headers = new Headers();
    headers.set("USER-AGENT", userAgent.toString());

    let res = await fetch(url, {method: 'HEAD', headers})

    if(res.status === 405) {
        res = await fetch(url, {headers});
    }
    
    return res.ok
}


const lintIt = (address) => {
    fetch(address).then(async res => {
        const text = await res.text();
        const dom = parse(text);
        let invalid = 0;
        let working = 0;
        const notWorking = [];

        for(const el of dom.querySelectorAll("a")) {
            let url = el.getAttribute("href");

            
            
            if(!url) {
                invalid++;
            }

            if(!isAbsolute(url)) {
                url = join(address,url);
            } 

            const spinner = ora(url).start();
            
            const check = await checklink(url);

            if(check) {
                working++

                spinner.succeed()
            } else {
                notWorking.push(url);

                spinner.fail()
            }
        }

        console.log("WORKING", working);
        console.log("NOT WORKING", notWorking.length);
        if(notWorking.length) {
            console.log(notWorking);
        }
        console.log("INVALID", invalid);
    });
}

const url = process.argv[2]

if(url) {
    lintIt(url)    
} else {
    console.warn("usage: npx hyperlint http://yoursite.com")
}

