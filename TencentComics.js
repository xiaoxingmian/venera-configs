class TencentComics extends ComicSource {
    name = "腾讯动漫"
    key = "tencentcomics"
    version = "1.0.0"
    minAppVersion = "1.5.0"
    BASE = "https://ac.qq.com"
    UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
    get baseHeaders() {
        return {
            "User-Agent": this.UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Referer": this.BASE + "/"
        }
    }

    // ==================== 工具函数：从ID拉取漫画详情信息（列表/搜索共用） ====================
    async fetchComicBriefById(comicId) {
        try {
            const url = `${this.BASE}/Comic/comicInfo/id/${comicId}`
            const res = await Network.get(url, { headers: this.baseHeaders })
            if (!res.body) return null
            const doc = new HtmlDocument(res.body)
            if (!doc) return null

            const titleEl = doc.querySelector("h1.works-intro-title.ui-left > strong") || doc.querySelector("h2.works-intro-title.ui-left > strong")
            const coverEl = doc.querySelector("div.works-cover.ui-left > a > img")
            const descEl = doc.querySelector("p.works-intro-short")
            const authorEl = doc.querySelector("p.works-intro-digi > span > em")

            return {
                title: titleEl ? this.cleanText(titleEl.text) : "",
                cover: coverEl ? (coverEl.attributes["src"] || "") : "",
                subtitle: authorEl ? this.cleanText(authorEl.text) : "",
                description: descEl ? this.cleanText(descEl.text) : ""
            }
        } catch (e) {
            return null
        }
    }

    cleanText(t) {
        return (t || "").replace(/\s+/g, " ").trim()
    }

    // 仅提取漫画ID，网页列表DOM已经不提供完整信息
    parseComicIdOnly(el) {
        if (!el) return null
        const a = el.querySelector("a[href*='/Comic/comicInfo/id/']")
        if (!a) return null
        const href = a.attributes["href"]
        if (!href) return null
        const m = href.match(/\/Comic\/comicInfo\/id\/(\d+)/)
        if (!m) return null
        return m[1]
    }

    /**
     * 加载分类列表页面：
     * 1. 解析页面拿漫画ID列表
     * 2. 解析页面【共xxx个结果】计算真实maxPage，每页12条
     * 3. 批量请求详情页补全漫画信息
     */
    async fetchCategoryComics(url) {
        try {
            const res = await Network.get(url, { headers: this.baseHeaders })
            if (!res.body) return { comics: [], maxPage: 1 }
            const doc = new HtmlDocument(res.body)
            if (!doc) return { comics: [], maxPage: 1 }

            // 提取漫画ID
            const items = doc.querySelectorAll("ul.ret-search-list.clearfix > li, li.ret-search-item.clearfix")
            const idList = []
            for (const li of items) {
                const cid = this.parseComicIdOnly(li)
                if (cid) idList.push(cid)
            }

            // 解析总数量，计算真实最大页数，每页12条
            let maxPage = 1
            const totalEl = doc.querySelector(".ret-result-num")
            if (totalEl) {
                const txt = this.cleanText(totalEl.text)
                const numMatch = txt.match(/(\d+)/)
                if (numMatch) {
                    const total = parseInt(numMatch[1],10)
                    maxPage = Math.max(1, Math.ceil(total / 12))
                }
            }

            // 分批请求详情补全信息，并发限制3，防止风控
            const concurrency = 3
            const comics = []
            for (let i = 0; i < idList.length; i += concurrency) {
                const sliceIds = idList.slice(i, i + concurrency)
                const promises = sliceIds.map(async (cid) => {
                    const brief = await this.fetchComicBriefById(cid)
                    if (!brief) return null
                    return new Comic({
                        id: cid,
                        title: brief.title || "未知标题",
                        subtitle: brief.subtitle,
                        cover: brief.cover,
                        description: brief.description
                    })
                })
                const results = await Promise.allSettled(promises)
                for (const r of results) {
                    if (r.status === "fulfilled" && r.value) comics.push(r.value)
                }
            }
            return { comics, maxPage }
        } catch (err) {
            return { comics: [], maxPage: 1 }
        }
    }

    // ==================== 解密逻辑完整保留（复刻 keiyoushi） ====================
    extractNonceExpr(html) {
        const idx = html.lastIndexOf("window[")
        if (idx < 0) throw "无法提取nonce混淆数据"
        let rest = html.substring(idx + "window[".length)
        const eq = rest.indexOf("] = ")
        if (eq < 0) throw "无法提取nonce混淆数据"
        rest = rest.substring(eq + 4)
        const se = rest.indexOf("</script>")
        if (se < 0) throw "无法提取nonce混淆数据"
        return rest.substring(0, se).trim().replace(/;\s*$/, "")
    }

    extractDataRaw(html) {
        const idx = html.lastIndexOf("var DATA =")
        if (idx < 0) throw "提取章节DATA失败"
        let rest = html.substring(idx + "var DATA =".length)
        const end = rest.indexOf("PRELOAD_NUM")
        if (end < 0) throw "提取章节DATA失败"
        let raw = rest.substring(0, end).trim()
        raw = raw.replace(/^'/, "").replace(/,$/, "").replace(/'$/, "")
        return raw
    }

    decryptRaw(raw, nonce) {
        let rawArr = raw.split('')
        const nonceList = nonce.match(/\d+[a-zA-Z]+/g)
        if (nonceList) {
            let len = nonceList.length
            while (len--) {
                const part = nonceList[len]
                const offset = parseInt(part) & 255
                const noise = part.replace(/\d+/g, '')
                rawArr.splice(offset, noise.length)
            }
        }
        return rawArr.join('')
    }

    decodeChapterData(raw, nonce) {
        const cleaned = this.decryptRaw(raw, nonce)
        const bin = Convert.decodeBase64(cleaned)
        const str = Convert.decodeUtf8(bin)
        return JSON.parse(str)
    }

    async fetchReadPage(readUrl) {
        let resp = await Network.get(readUrl, { headers: this.baseHeaders })
        let html = resp.body
        let nonceExpr = this.extractNonceExpr(html)
        let retry = 0
        while ((nonceExpr.includes("document") || nonceExpr.includes("window")) && retry < 3) {
            const doc = new HtmlDocument(html)
            const nextA = doc.querySelector("li.now-reading > a")
            if (!nextA) throw "刷新阅读页失败"
            readUrl = this.BASE + nextA.attributes["href"]
            resp = await Network.get(readUrl, { headers: this.baseHeaders })
            html = resp.body
            nonceExpr = this.extractNonceExpr(html)
            retry++
        }
        return { html, nonceExpr }
    }

    // ==================== 探索页 multiPartPage：双区块，标题+viewMore查看更多 ====================
    explore = [
        {
            title: "腾讯动漫",
            type: "multiPartPage",
            load: async () => {
                // 串行请求，降低风控概率
                const hotRes = await this.fetchCategoryComics(`${this.BASE}/Comic/all/search/hot/page/1`)
                const newRes = await this.fetchCategoryComics(`${this.BASE}/Comic/all/search/time/page/1`)
                return [
                    {
                        title: "热门",
                        comics: hotRes.comics,
                        viewMore: "category:热门@hot"
                    },
                    {
                        title: "最近更新",
                        comics: newRes.comics,
                        viewMore: "category:最近更新@time"
                    }
                ]
            }
        }
    ]

    // ==================== 分类定义，对应viewMore跳转 ====================
    category = {
        title: "腾讯动漫",
        parts: [
            {
                name: "排序",
                type: "fixed",
                categories: ["热门", "最近更新"],
                itemType: "category",
                categoryParams: ["hot", "time"]
            }
        ],
        enableRankingPage: false
    }

    categoryComics = {
        load: async (category, param, options, page) => {
            const p = param || (category === "最近更新" ? "time" : "hot")
            const url = `${this.BASE}/Comic/all/search/${p}/page/${page}`
            return await this.fetchCategoryComics(url)
        }
    }

    // ==================== 搜索 ====================
    /**
     * ⚠️重要：腾讯动漫文本搜索接口 /comic/search/result 是一次性返回全部结果，**没有分页接口**，maxPage强制=1
     * 因此搜索页面没有翻页/查看更多按钮，属于网站限制，脚本无法实现分页
     */
    search = {
        load: async (keyword, options, page) => {
            try {
                keyword = keyword.trim()
                if (!keyword) return { comics: [], maxPage: 0 }
                const url = `${this.BASE}/comic/search/result?word=${encodeURIComponent(keyword)}`
                const res = await Network.get(url, { headers: this.baseHeaders })
                if (!res.body) return { comics: [], maxPage: 1 }
                const lines = (res.body || "").trim().split("\n")
                const idList = []
                for (const line of lines) {
                    const parts = line.split("|")
                    if (parts.length < 2) continue
                    const id = parts[0].trim()
                    if (!id) continue
                    idList.push(id)
                }

                const concurrency = 3
                const comics = []
                for (let i = 0; i < idList.length; i += concurrency) {
                    const sliceIds = idList.slice(i, i + concurrency)
                    const promises = sliceIds.map(async (cid) => {
                        const brief = await this.fetchComicBriefById(cid)
                        if (!brief) return null
                        return new Comic({
                            id: cid,
                            title: brief.title || "未知标题",
                            subtitle: brief.subtitle,
                            cover: brief.cover,
                            description: brief.description
                        })
                    })
                    const results = await Promise.allSettled(promises)
                    for (const r of results) {
                        if (r.status === "fulfilled" && r.value) comics.push(r.value)
                    }
                }
                return { comics, maxPage: 1 }
            } catch (e) {
                return { comics: [], maxPage: 1 }
            }
        }
    }

    // ==================== 漫画详情、阅读解密 ====================
    comic = {
        loadInfo: async (id) => {
            const url = `${this.BASE}/Comic/comicInfo/id/${id}`
            const res = await Network.get(url, { headers: this.baseHeaders })
            const doc = new HtmlDocument(res.body)
            const titleEl = doc.querySelector("h1.works-intro-title.ui-left > strong") || doc.querySelector("h2.works-intro-title.ui-left > strong")
            const title = titleEl ? this.cleanText(titleEl.text) : ""
            const coverEl = doc.querySelector("div.works-cover.ui-left > a > img")
            const cover = coverEl ? (coverEl.attributes["src"] || "") : ""
            const descEl = doc.querySelector("p.works-intro-short")
            const description = descEl ? this.cleanText(descEl.text) : ""
            const authorEl = doc.querySelector("p.works-intro-digi > span > em")
            const author = authorEl ? this.cleanText(authorEl.text) : ""
            const statusEl = doc.querySelector("label.works-intro-status")
            const statusText = statusEl ? this.cleanText(statusEl.text) : ""
            const chapterItems = doc.querySelectorAll(".works-chapter-item")
            const chapters = new Map()
            for (const el of chapterItems) {
                const a = el.querySelector("a")
                if (!a) continue
                const chapUrl = a.attributes["href"]
                if (!chapUrl) continue
                const isLocked = !!el.querySelector(".ui-icon-pay")
                let chapName = this.cleanText(el.text)
                if (isLocked) chapName = "🔒 " + chapName
                chapters.set(chapUrl, chapName)
            }
            // 不再反转！直接使用原始DOM顺序：第1话在最前面，最新章节在底部
            return new ComicDetails({
                title: title,
                cover: cover,
                description: description,
                subtitle: author,
                chapters: chapters,
                tags: {
                    "状态": statusText ? [statusText] : []
                }
            })
        },
        loadEp: async (comicId, epId) => {
            let readUrl = this.BASE + epId
            const { html, nonceExpr } = await this.fetchReadPage(readUrl)
            let nonceVal
            try {
                nonceVal = eval(nonceExpr)
            } catch (e) {
                throw "nonce求值失败: " + e
            }
            const raw = this.extractDataRaw(html)
            let chapterJson
            try {
                chapterJson = this.decodeChapterData(raw, nonceVal)
            } catch (e) {
                throw "图片数据解码失败: " + e
            }
            const chapter = chapterJson.chapter || {}
            if (!chapter.canRead) {
                throw "此章节为付费内容，需要前往腾讯动漫APP阅读"
            }
            const picList = chapterJson.picture || []
            const images = picList.map(p => p.url)
            return { images: images }
        },
        onImageLoad: (url) => {
            return {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
                    "Referer": "https://ac.qq.com/"
                }
            }
        },
        onThumbnailLoad: (url) => {
            return {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
                    "Referer": "https://ac.qq.com/"
                }
            }
        },
        idMatch: "^\\d+$"
    }
}

