const { openBrowser, openTab, closeTab, goto, click, write, currentURL, textBox } = require('taiko');
const consola = require('consola');
const getUrls = require('get-urls');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const dotenv = require('dotenv');
dotenv.config();
const login = async () => {
    await click("Login");
    await write(process.env.DD_EMAIL, textBox({ id: 'login' }));
    await write(process.env.DD_PASSWORD, textBox({ id: 'password' }));
    await click("Login");
    consola.success('Login Succesful');
}
const prepareBrowser = async () => {
    try {
        await openBrowser({ headless: true });
        consola.success('Browser Opened');
        await goto("https://www.desidime.com", {
            'waitForEvents': ['DOMContentLoaded']
        });
        consola.success('DesiDime Opened!');
        await login();
        await goto('https://www.desidime.com/deals/new', {
            'waitForEvents': ['DOMContentLoaded']
        });
        consola.success('New Deal Page Opened!');
    }
    catch (error) {
        console.error(error);
    }
};
prepareBrowser();
const app = express();
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});
app.post('/submitPost', function (req, res) {
    res.send('Got a POST request');
    postDeal(req.body.dealData);
})

app.listen(3000, () => console.log('DD app listening on port 3000!'));

const postDeal = async (dealData) => {
    try {
        consola.success('Got Deal Data!');
        const { dealTitle, dealURL } = await processDealData(dealData);
        consola.success('Proccessed Deal Data');
        const currentPage = await currentURL();
        if (currentPage === 'https://www.desidime.com/deals/new') {
            await write(dealURL, textBox({ id: 'topic_deal_url' }), {
                'waitForNavigation': false
            });
            await write(dealTitle, textBox({ id: 'deal-title' }), {
                'waitForNavigation': false
            });
            await write('.', textBox({ id: 'body' }), {
                'waitForNavigation': false
            });
            await click("Post Deal");
            consola.success('Deal Posted!');
        } else {
            const currentPage = await currentURL();
            consola.error('Some Error' + currentPage);
        }
        await goto('https://www.desidime.com/deals/new', {
            'waitForEvents': ['DOMContentLoaded']
        });
    }
    catch (error) {
        console.error(error);
    }

}

const processDealData = async (dealData) => {
    const shortURL = getUrls(dealData);
    await openTab(...shortURL);
    const affiURL = await currentURL();
    await closeTab();
    const dealURL = RemoveParameterFromUrl(affiURL, ['linkCode', 'tag', 'linkId', 'affid', 'Site', 'telegram', 'affExtParam2', 'affExtParam1']);
    const dealTitle = dealData.replace(...shortURL, "").trim();
    return {
        dealTitle,
        dealURL
    };
}
const RemoveParameterFromUrl = (url, parameter) => {
    let url1 = new URL(url);
    let params = new URLSearchParams(url1.search.slice(1));
    parameter.forEach(key => params.delete(key));
    return url.split("?")[0] + '?' + params.toString();
}