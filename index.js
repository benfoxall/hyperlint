#!/usr/bin/env node

const fetch = require("node-fetch");


const lintIt = (address) => {
    fetch(address).then(async res => {
        const text = await res.text();
        console.log(text);
    });
}

lintIt("http://www.benjaminbenben.com");