/** @type {import('./_venera_.js')} */

class HuakaComic extends ComicSource {
    name = "花咔漫画";
    key = "huakacomic";
    version = "1.0.0";
    minAppVersion = "1.4.0";

    url = "";

    baseUrl =
        "https://app.huakacomic.com/api/bff";


    /*
     * ============================================================
     * 基础请求
     * ============================================================
     */

    async getJson(url) {

        const response =
            await Network.get(url, {

                "Accept":
                    "application/json",

                "User-Agent":
                    "Mozilla/5.0 (Linux; Android 10; K) " +
                    "AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) " +
                    "Chrome/140.0.0.0 Mobile Safari/537.36",

                "Referer":
                    "https://app.huakacomic.com/"
            });


        if (!response) {
            throw "花咔请求失败";
        }


        if (
            response.status !== undefined &&
            response.status !== 200
        ) {

            throw (
                "花咔请求失败: HTTP " +
                response.status
            );
        }


        let json;


        try {

            json =
                JSON.parse(
                    response.body
                );

        } catch (e) {

            throw "花咔返回的数据不是有效 JSON";
        }


        if (
            json &&
            json.statusCode &&
            json.statusCode !== 200
        ) {

            throw (
                "花咔 API 错误: " +
                (
                    json.message ||
                    json.statusCode
                )
            );
        }


        if (
            json &&
            json.error
        ) {

            throw (
                "花咔 API 错误: " +
                (
                    typeof json.error ===
                    "string"
                        ? json.error
                        : JSON.stringify(
                            json.error
                        )
                )
            );
        }


        return json;
    }


    /*
     * ============================================================
     * URL 编码
     * ============================================================
     */

    encode(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";
        }


        return encodeURIComponent(
            String(value)
        );
    }


    /*
     * ============================================================
     * 获取 data
     * ============================================================
     */

    getData(response) {

        if (
            response &&
            response.data
        ) {

            return response.data;
        }


        return {};
    }


    /*
     * ============================================================
     * 获取下一页 Token
     * ============================================================
     */

    getNextPageToken(response) {

        if (!response) {
            return null;
        }


        if (
            response.nextPageToken
        ) {

            return response.nextPageToken;
        }


        if (
            response.next_page_token
        ) {

            return response.next_page_token;
        }


        if (
            response.data
        ) {

            if (
                response.data.nextPageToken
            ) {

                return response
                    .data
                    .nextPageToken;
            }


            if (
                response.data.next_page_token
            ) {

                return response
                    .data
                    .next_page_token;
            }
        }


        return null;
    }


    /*
     * ============================================================
     * Base64URL 解码
     *
     * 不使用 atob()
     * 兼容 flutter_qjs
     * ============================================================
     */

    decodeBase64UrlText(token) {

        if (
            !token ||
            typeof token !== "string"
        ) {

            return null;
        }


        try {

            let input =
                token
                    .replace(/-/g, "+")
                    .replace(/_/g, "/");


            while (
                input.length % 4 !== 0
            ) {

                input += "=";
            }


            const chars =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
                "abcdefghijklmnopqrstuvwxyz" +
                "0123456789+/";


            let buffer =
                0;

            let bits =
                0;

            let output =
                "";


            for (
                let i = 0;

                i < input.length;

                i++
            ) {

                const char =
                    input.charAt(i);


                if (
                    char === "="
                ) {

                    break;
                }


                const value =
                    chars.indexOf(
                        char
                    );


                if (
                    value < 0
                ) {

                    continue;
                }


                buffer =
                    (
                        buffer << 6
                    ) |
                    value;


                bits += 6;


                if (
                    bits >= 8
                ) {

                    bits -= 8;


                    output +=
                        String.fromCharCode(
                            (
                                buffer >>
                                bits
                            ) &
                            0xff
                        );
                }
            }


            return output;

        } catch (e) {

            console.log(
                "[花咔] Base64 解码失败:",
                e
            );

            return null;
        }
    }


    /*
     * ============================================================
     * 从 pageToken 获取搜索总数量
     *
     * 花咔 Token 示例：
     *
     * {
     *   "pit_id": "...",
     *   "search_after": [...],
     *   "query_hash": "...",
     *   "page_size": 20,
     *   "offset": 40,
     *   "total": 1594
     * }
     * ============================================================
     */

    getSearchTotalFromToken(token) {

        const decoded =
            this.decodeBase64UrlText(
                token
            );


        if (
            !decoded
        ) {

            return null;
        }


        /*
         * 优先 JSON 解析
         */

        try {

            const tokenData =
                JSON.parse(
                    decoded
                );


            if (
                tokenData &&
                typeof tokenData.total ===
                    "number" &&
                isFinite(
                    tokenData.total
                )
            ) {

                return Math.max(
                    0,
                    Math.floor(
                        tokenData.total
                    )
                );
            }

        } catch (e) {

            /*
             * JSON 解析失败时，
             * 继续使用正则读取 total。
             */
        }


        /*
         * 备用方式：
         *
         * "total":1594
         */

        try {

            const match =
                decoded.match(
                    /"total"\s*:\s*(\d+)/
                );


            if (
                match
            ) {

                const total =
                    Number(
                        match[1]
                    );


                if (
                    isFinite(
                        total
                    )
                ) {

                    return Math.max(
                        0,
                        Math.floor(
                            total
                        )
                    );
                }
            }

        } catch (e) {

            console.log(
                "[花咔] total 解析失败:",
                e
            );
        }


        return null;
    }


    /*
     * ============================================================
     * Comic 转换
     * ============================================================
     */

    parseComic(comic) {

        if (!comic) {
            return null;
        }


        /*
         * categories = 花咔分类
         * tags       = 花咔标签
         */

        const tags = [];


        if (
            Array.isArray(
                comic.categories
            )
        ) {

            for (
                const category
                of comic.categories
            ) {

                if (
                    category &&
                    tags.indexOf(
                        category
                    ) === -1
                ) {

                    tags.push(
                        category
                    );
                }
            }
        }


        if (
            Array.isArray(
                comic.tags
            )
        ) {

            for (
                const tag
                of comic.tags
            ) {

                if (
                    tag &&
                    tags.indexOf(
                        tag
                    ) === -1
                ) {

                    tags.push(
                        tag
                    );
                }
            }
        }


        /*
         * 作者
         */

        let author = "";


        if (
            Array.isArray(
                comic.authors
            )
        ) {

            author =
                comic.authors
                    .filter(Boolean)
                    .join(", ");
        }


        /*
         * 汉化组
         */

        let subtitle =
            author;


        if (
            Array.isArray(
                comic.translationTeams
            ) &&
            comic.translationTeams.length >
                0
        ) {

            const teams =
                comic.translationTeams
                    .filter(Boolean)
                    .join(", ");


            if (teams) {

                subtitle =
                    author
                        ? author +
                          " · " +
                          teams
                        : teams;
            }
        }


        /*
         * 星级
         */

        let stars =
            undefined;


        if (
            typeof comic.totalLikes ===
            "number"
        ) {

            stars =
                Math.min(
                    5,
                    Math.max(
                        0,
                        comic.totalLikes /
                            20
                    )
                );
        }


        return {

            id:
                String(
                    comic.id
                ),

            title:
                comic.title ||
                "未知标题",

            subtitle:
                subtitle ||
                undefined,

            cover:
                comic.thumbnailUrl ||
                "",

            tags:
                tags,

            description:
                comic.description ||
                "",

            language:
                Array.isArray(
                    comic.languages
                ) &&
                comic.languages.length >
                    0
                    ? comic.languages[0]
                    : undefined,

            stars:
                stars
        };
    }


    /*
     * ============================================================
     * 推荐数据解析
     * ============================================================
     */

    parseRecommendComics(response) {

        const data =
            this.getData(
                response
            );

        let list = [];


        if (
            Array.isArray(
                data.comics
            )
        ) {

            list =
                data.comics;

        } else if (
            Array.isArray(
                data.recommendations
            )
        ) {

            list =
                data.recommendations;

        } else if (
            Array.isArray(
                data.items
            )
        ) {

            list =
                data.items;
        }


        return list
            .map(
                item => {

                    if (
                        item &&
                        item.comic
                    ) {

                        return this.parseComic(
                            item.comic
                        );
                    }


                    return this.parseComic(
                        item
                    );
                }
            )
            .filter(
                Boolean
            );
    }


    /*
     * ============================================================
     * 人气数据解析
     * ============================================================
     */

    parsePopularComics(response) {

        const data =
            this.getData(
                response
            );

        let list = [];


        if (
            Array.isArray(
                data.entries
            )
        ) {

            list =
                data.entries;

        } else if (
            Array.isArray(
                data.items
            )
        ) {

            list =
                data.items;

        } else if (
            Array.isArray(
                data.comics
            )
        ) {

            list =
                data.comics;
        }


        return list
            .map(
                item => {

                    if (
                        item &&
                        item.comic
                    ) {

                        return this.parseComic(
                            item.comic
                        );
                    }


                    return this.parseComic(
                        item
                    );
                }
            )
            .filter(
                Boolean
            );
    }


    /*
     * ============================================================
     * 首页
     * ============================================================
     */

    explore = [

        {
            title:
                "花咔漫畫",

            type:
                "multiPartPage",

            load:
                async () => {

                    const result =
                        [];


                    /*
                     * =================================================
                     * 为你推荐
                     * =================================================
                     */

                    try {

                        const response =
                            await this.getJson(
                                `${this.baseUrl}` +
                                `/recommendations/home` +
                                `?pageSize=20` +
                                `&excludeRead=true`
                            );


                        const comics =
                            this.parseRecommendComics(
                                response
                            );


                        if (
                            comics.length >
                            0
                        ) {

                            result.push({

                                title:
                                    "为你推荐",

                                comics:
                                    comics,

                                viewMore: {

                                    page:
                                        "category",

                                    attributes: {

                                        category:
                                            "为你推荐",

                                        param:
                                            "recommend"
                                    }
                                }
                            });
                        }

                    } catch (e) {

                        console.log(
                            "[花咔] 为你推荐加载失败:",
                            e
                        );
                    }


                    /*
                     * =================================================
                     * 最近更新
                     * =================================================
                     */

                    try {

                        const response =
                            await this.getJson(
                                `${this.baseUrl}` +
                                `/comics` +
                                `?pageSize=20` +
                                `&sort=updated`
                            );


                        const data =
                            this.getData(
                                response
                            );


                        const comics =
                            Array.isArray(
                                data.comics
                            )
                                ? data.comics
                                    .map(
                                        item =>
                                            this.parseComic(
                                                item
                                            )
                                    )
                                    .filter(
                                        Boolean
                                    )
                                : [];


                        if (
                            comics.length >
                            0
                        ) {

                            result.push({

                                title:
                                    "最新更新",

                                comics:
                                    comics,

                                viewMore: {

                                    page:
                                        "category",

                                    attributes: {

                                        category:
                                            "最新更新",

                                        param:
                                            "updated"
                                    }
                                }
                            });
                        }

                    } catch (e) {

                        console.log(
                            "[花咔] 最近更新加载失败:",
                            e
                        );
                    }


                    /*
                     * =================================================
                     * 大众人气
                     * =================================================
                     */

                    try {

                        const response =
                            await this.getJson(
                                `${this.baseUrl}` +
                                `/engagement/v2/leaderboards`
                            );


                        const comics =
                            this.parsePopularComics(
                                response
                            );


                        if (
                            comics.length >
                            0
                        ) {

                            result.push({

                                title:
                                    "大众人气",

                                comics:
                                    comics,

                                viewMore: {

                                    page:
                                        "category",

                                    attributes: {

                                        category:
                                            "大众人气",

                                        param:
                                            "popular"
                                    }
                                }
                            });
                        }

                    } catch (e) {

                        console.log(
                            "[花咔] 大众人气加载失败:",
                            e
                        );
                    }


                    return result;
                }
        }
    ];


    /*
     * ============================================================
     * 分类
     * ============================================================
     */

    category = {

        title:
            "花咔漫畫",

        parts: [

            {

                name:
                    "分類",

                type:
                    "fixed",

                categories: [

                    "最新更新",

                    "短篇",

                    "長篇",

                    "全彩",

                    "同人",

                    "正太",

                    "FURRY",

                    "純愛",

                    "NTR",

                    "韓漫｜WEBTOON",

                    "調教｜BDSM",

                    "CG雜圖",

                    "生肉",

                    "一般向丨無H內容",

                    "重口丨獵奇",

                    "ABO",

                    "女體化",

                    "互攻",

                    "筋肉系",

                    "單行本"
                ],

                itemType:
                    "category",

                categoryParams: [

                    "updated",

                    "短篇",

                    "長篇",

                    "全彩",

                    "同人",

                    "正太",

                    "FURRY",

                    "純愛",

                    "NTR",

                    "韓漫｜WEBTOON",

                    "調教｜BDSM",

                    "CG雜圖",

                    "生肉",

                    "一般向丨無H內容",

                    "重口丨獵奇",

                    "ABO",

                    "女體化",

                    "互攻",

                    "筋肉系",

                    "單行本"
                ]
            }
        ],

        enableRankingPage:
            false
    };


    /*
     * ============================================================
     * 分类漫画
     * ============================================================
     */

    categoryComics = {

        load:
            async (
                category,
                param,
                options,
                page
            ) => {

                const pageSize =
                    20;


                const targetPage =
                    Number(page) > 0
                        ? Number(page)
                        : 1;


                /*
                 * =================================================
                 * 为你推荐
                 * =================================================
                 */

                if (
                    param ===
                    "recommend"
                ) {

                    let pageToken =
                        null;

                    let response =
                        null;


                    for (
                        let currentPage =
                            1;

                        currentPage <=
                            targetPage;

                        currentPage++
                    ) {

                        let url =
                            `${this.baseUrl}` +
                            `/recommendations/home` +
                            `?pageSize=${pageSize}` +
                            `&excludeRead=true`;


                        if (
                            pageToken
                        ) {

                            url +=
                                `&pageToken=${this.encode(
                                    pageToken
                                )}`;
                        }


                        response =
                            await this.getJson(
                                url
                            );


                        if (
                            currentPage <
                            targetPage
                        ) {

                            const nextToken =
                                this.getNextPageToken(
                                    response
                                );


                            if (
                                !nextToken ||
                                nextToken ===
                                    pageToken
                            ) {

                                return {

                                    comics:
                                        [],

                                    maxPage:
                                        currentPage
                                };
                            }


                            pageToken =
                                nextToken;
                        }
                    }


                    const comics =
                        this.parseRecommendComics(
                            response
                        );


                    const nextToken =
                        this.getNextPageToken(
                            response
                        );


                    return {

                        comics:
                            comics,

                        maxPage:
                            nextToken
                                ? targetPage + 1
                                : targetPage
                    };
                }


                /*
                 * =================================================
                 * 大众人气
                 * =================================================
                 */

                if (
                    param ===
                    "popular"
                ) {

                    let pageToken =
                        null;

                    let response =
                        null;


                    for (
                        let currentPage =
                            1;

                        currentPage <=
                            targetPage;

                        currentPage++
                    ) {

                        let url =
                            `${this.baseUrl}` +
                            `/engagement/v2/leaderboards`;


                        if (
                            pageToken
                        ) {

                            url +=
                                `?pageToken=${this.encode(
                                    pageToken
                                )}`;
                        }


                        response =
                            await this.getJson(
                                url
                            );


                        if (
                            currentPage <
                            targetPage
                        ) {

                            const nextToken =
                                this.getNextPageToken(
                                    response
                                );


                            if (
                                !nextToken ||
                                nextToken ===
                                    pageToken
                            ) {

                                return {

                                    comics:
                                        [],

                                    maxPage:
                                        currentPage
                                };
                            }


                            pageToken =
                                nextToken;
                        }


                        if (
                            currentPage <
                            targetPage
                        ) {

                            pageToken =
                                this.getNextPageToken(
                                    response
                                );
                        }
                    }


                    const comics =
                        this.parsePopularComics(
                            response
                        );


                    const nextToken =
                        this.getNextPageToken(
                            response
                        );


                    return {

                        comics:
                            comics,

                        maxPage:
                            nextToken
                                ? targetPage + 1
                                : targetPage
                    };
                }


                /*
                 * =================================================
                 * 最新更新
                 * =================================================
                 */

                if (
                    param ===
                    "updated"
                ) {

                    let pageToken =
                        null;

                    let response =
                        null;


                    for (
                        let currentPage =
                            1;

                        currentPage <=
                            targetPage;

                        currentPage++
                    ) {

                        let url =
                            `${this.baseUrl}` +
                            `/comics` +
                            `?pageSize=${pageSize}` +
                            `&sort=updated`;


                        if (
                            pageToken
                        ) {

                            url +=
                                `&pageToken=${this.encode(
                                    pageToken
                                )}`;
                        }


                        console.log(
                            "[花咔] 最新更新请求:",
                            url
                        );


                        response =
                            await this.getJson(
                                url
                            );


                        if (
                            currentPage <
                            targetPage
                        ) {

                            const nextToken =
                                this.getNextPageToken(
                                    response
                                );


                            if (
                                !nextToken ||
                                nextToken ===
                                    pageToken
                            ) {

                                return {

                                    comics:
                                        [],

                                    maxPage:
                                        currentPage
                                };
                            }


                            pageToken =
                                nextToken;
                        }
                    }


                    const data =
                        this.getData(
                            response
                        );


                    const comics =
                        Array.isArray(
                            data.comics
                        )
                            ? data.comics
                                .map(
                                    item =>
                                        this.parseComic(
                                            item
                                        )
                                )
                                .filter(
                                    Boolean
                                )
                            : [];


                    const nextToken =
                        this.getNextPageToken(
                            response
                        );


                    console.log(
                        "[花咔] 最新更新:",
                        comics.length,
                        "下一页:",
                        !!nextToken
                    );


                    return {

                        comics:
                            comics,

                        maxPage:
                            nextToken
                                ? targetPage + 1
                                : targetPage
                    };
                }


                /*
                 * =================================================
                 * 正式分类
                 * =================================================
                 */

                let pageToken =
                    null;

                let response =
                    null;


                for (
                    let currentPage =
                        1;

                    currentPage <=
                        targetPage;

                    currentPage++
                ) {

                    let url =
                        `${this.baseUrl}` +
                        `/comic-search` +
                        `?pageSize=${pageSize}` +
                        `&sort=latest` +
                        `&categories=${this.encode(
                            category
                        )}`;


                    if (
                        pageToken
                    ) {

                        url +=
                            `&pageToken=${this.encode(
                                pageToken
                            )}`;
                    }


                    console.log(
                        "[花咔] 分类请求:",
                        url
                    );


                    response =
                        await this.getJson(
                            url
                        );


                    if (
                        currentPage <
                        targetPage
                    ) {

                        const nextToken =
                            this.getNextPageToken(
                                response
                            );


                        if (
                            !nextToken ||
                            nextToken ===
                                pageToken
                        ) {

                            return {

                                comics:
                                    [],

                                maxPage:
                                    currentPage
                            };
                        }


                        pageToken =
                            nextToken;
                    }
                }


                const data =
                    this.getData(
                        response
                    );


                const comics =
                    Array.isArray(
                        data.comics
                    )
                        ? data.comics
                            .map(
                                item =>
                                    this.parseComic(
                                        item
                                    )
                            )
                            .filter(
                                Boolean
                            )
                        : [];


                const nextToken =
                    this.getNextPageToken(
                        response
                    );


                console.log(
                    "[花咔] 分类:",
                    category,
                    "数量:",
                    comics.length,
                    "下一页:",
                    !!nextToken
                );


                return {

                    comics:
                        comics,

                    maxPage:
                        nextToken
                            ? targetPage + 1
                            : targetPage
                };
            },

        optionList:
            []
    };


    /*
     * ============================================================
     * 搜索
     *
     * ★ 使用 load，不使用 loadNext
     *
     * Venera 的 search.load：
     *
     * load(keyword, options, page)
     *
     * 返回：
     *
     * {
     *     comics: [],
     *     maxPage: number
     * }
     *
     * 花咔本身使用 Cursor Token，
     * 所以这里根据 page 逐页取得 Token。
     * ============================================================
     */

    search = {

        optionList:
            [],


        load:
            async (
                keyword,
                options,
                page
            ) => {

                const pageSize =
                    20;


                /*
                 * Venera 页码从 1 开始。
                 */

                const targetPage =
                    Number(page) > 0
                        ? Number(page)
                        : 1;


                let pageToken =
                    null;

                let response =
                    null;


                /*
                 * =================================================
                 * 从第 1 页开始一直获取到目标页
                 *
                 * 第 1 页：
                 *
                 * /comic-search
                 *
                 * 第 2 页：
                 *
                 * /comic-search
                 * &pageToken=上一页Token
                 *
                 * 第 3 页：
                 *
                 * /comic-search
                 * &pageToken=第二页Token
                 *
                 * =================================================
                 */

                for (
                    let currentPage =
                        1;

                    currentPage <=
                        targetPage;

                    currentPage++
                ) {

                    let url =
                        `${this.baseUrl}` +
                        `/comic-search` +
                        `?query=${this.encode(
                            keyword
                        )}` +
                        `&sort=relevance` +
                        `&pageSize=${pageSize}`;


                    if (
                        pageToken
                    ) {

                        url +=
                            `&pageToken=${this.encode(
                                pageToken
                            )}`;
                    }


                    console.log(
                        "[花咔] 搜索第",
                        currentPage,
                        "页:",
                        url
                    );


                    response =
                        await this.getJson(
                            url
                        );


                    /*
                     * 还没到目标页，
                     * 就必须继续获取下一页 Token。
                     */

                    if (
                        currentPage <
                        targetPage
                    ) {

                        const nextToken =
                            this.getNextPageToken(
                                response
                            );


                        if (
                            !nextToken ||
                            nextToken ===
                                pageToken
                        ) {

                            console.log(
                                "[花咔] 搜索无法继续翻页:",
                                currentPage
                            );


                            return {

                                comics:
                                    [],

                                maxPage:
                                    currentPage
                            };
                        }


                        pageToken =
                            nextToken;
                    }
                }


                /*
                 * =================================================
                 * 解析当前页漫画
                 * =================================================
                 */

                const data =
                    this.getData(
                        response
                    );


                const comics =
                    Array.isArray(
                        data.comics
                    )
                        ? data.comics
                            .map(
                                item =>
                                    this.parseComic(
                                        item
                                    )
                            )
                            .filter(
                                Boolean
                            )
                        : [];


                /*
                 * =================================================
                 * 获取当前页 Token
                 *
                 * 这里的 Token 中包含 total。
                 * =================================================
                 */

                const nextToken =
                    this.getNextPageToken(
                        response
                    );


                /*
                 * 当前页请求时使用的 Token
                 *
                 * 第 1 页：
                 *
                 * pageToken = null
                 *
                 * 所以使用 response 的 nextToken。
                 *
                 *
                 * 第 2 页以后：
                 *
                 * pageToken 本身就包含 total。
                 * =================================================
                 */

                const totalToken =
                    pageToken ||
                    nextToken;


                const total =
                    this.getSearchTotalFromToken(
                        totalToken
                    );


                /*
                 * =================================================
                 * 计算总页数
                 *
                 * total = 397
                 *
                 * ceil(397 / 20)
                 * = 20
                 *
                 * total = 1594
                 *
                 * ceil(1594 / 20)
                 * = 80
                 * =================================================
                 */

                let maxPage =
                    targetPage;


                if (
                    total !== null
                ) {

                    maxPage =
                        Math.max(
                            targetPage,
                            Math.ceil(
                                total /
                                pageSize
                            )
                        );
                } else {

                    /*
                     * 如果 Token 中暂时没有 total，
                     * 至少根据有没有下一页，
                     * 告诉 Venera 是否还能继续。
                     */

                    if (
                        nextToken
                    ) {

                        maxPage =
                            targetPage + 1;

                    } else {

                        maxPage =
                            targetPage;
                    }
                }


                console.log(
                    "[花咔] 搜索完成:",
                    "关键词=",
                    keyword,
                    "当前页=",
                    targetPage,
                    "漫画数=",
                    comics.length,
                    "总数=",
                    total,
                    "最大页=",
                    maxPage,
                    "下一页=",
                    !!nextToken
                );


                /*
                 * =================================================
                 * ★ Venera Search.load 正确返回格式
                 *
                 * 只返回：
                 *
                 * comics
                 * maxPage
                 *
                 * 不返回 next。
                 *
                 * =================================================
                 */

                return {

                    comics:
                        comics,

                    maxPage:
                        maxPage
                };
            }
    };


    /*
     * ============================================================
     * 漫画详情
     * ============================================================
     */

    comic = {

        loadInfo:
            async (
                id
            ) => {

                const comicUrl =
                    `${this.baseUrl}` +
                    `/comics/` +
                    `${this.encode(id)}`;


                const episodeUrl =
                    `${this.baseUrl}` +
                    `/episodes` +
                    `?comicId=${this.encode(
                        id
                    )}` +
                    `&sortOrder=asc` +
                    `&pageSize=25`;


                const responses =
                    await Promise.all([

                        this.getJson(
                            comicUrl
                        ),

                        this.getJson(
                            episodeUrl
                        )
                    ]);


                const comicResponse =
                    responses[0];

                const firstEpisodeResponse =
                    responses[1];


                let comicData =
                    null;


                if (
                    comicResponse &&
                    comicResponse.data
                ) {

                    if (
                        comicResponse
                            .data
                            .comic
                    ) {

                        comicData =
                            comicResponse
                                .data
                                .comic;

                    } else {

                        comicData =
                            comicResponse
                                .data;
                    }
                }


                if (
                    !comicData
                ) {

                    throw (
                        "花咔没有找到漫画: " +
                        id
                    );
                }


                /*
                 * =================================================
                 * 获取全部章节
                 * =================================================
                 */

                let episodes =
                    [];


                const firstData =
                    this.getData(
                        firstEpisodeResponse
                    );


                if (
                    Array.isArray(
                        firstData.episodes
                    )
                ) {

                    episodes =
                        episodes.concat(
                            firstData.episodes
                        );
                }


                let pageToken =
                    this.getNextPageToken(
                        firstEpisodeResponse
                    );


                let safety =
                    0;


                while (
                    pageToken &&
                    safety < 100
                ) {

                    safety++;


                    const url =
                        `${this.baseUrl}` +
                        `/episodes` +
                        `?comicId=${this.encode(
                            id
                        )}` +
                        `&sortOrder=asc` +
                        `&pageSize=25` +
                        `&pageToken=${this.encode(
                            pageToken
                        )}`;


                    const response =
                        await this.getJson(
                            url
                        );


                    const data =
                        this.getData(
                            response
                        );


                    if (
                        Array.isArray(
                            data.episodes
                        )
                    ) {

                        episodes =
                            episodes.concat(
                                data.episodes
                            );
                    }


                    const nextToken =
                        this.getNextPageToken(
                            response
                        );


                    if (
                        !nextToken ||
                        nextToken ===
                            pageToken
                    ) {

                        break;
                    }


                    pageToken =
                        nextToken;
                }


                /*
                 * =================================================
                 * 章节排序
                 * =================================================
                 */

                episodes.sort(
                    (
                        a,
                        b
                    ) => {

                        const orderA =
                            typeof a.order ===
                            "number"
                                ? a.order
                                : 0;


                        const orderB =
                            typeof b.order ===
                            "number"
                                ? b.order
                                : 0;


                        return (
                            orderA -
                            orderB
                        );
                    }
                );


                /*
                 * =================================================
                 * 构建章节
                 * =================================================
                 */

                const chapters =
                    {};


                for (
                    let index =
                        0;

                    index <
                        episodes.length;

                    index++
                ) {

                    const episode =
                        episodes[index];


                    if (
                        !episode ||
                        episode.id ===
                            undefined ||
                        episode.id ===
                            null
                    ) {

                        continue;
                    }


                    const episodeId =
                        "ep_" +
                        String(
                            episode.id
                        );


                    const title =
                        episode.title
                            ? String(
                                episode.title
                            )
                            : "第 " +
                              (
                                  index +
                                  1
                              ) +
                              " 话";


                    chapters[
                        episodeId
                    ] =
                        title;
                }


                /*
                 * =================================================
                 * 详情信息
                 * =================================================
                 */

                const authors =
                    Array.isArray(
                        comicData.authors
                    )
                        ? comicData.authors
                            .filter(
                                Boolean
                            )
                        : [];


                const categories =
                    Array.isArray(
                        comicData.categories
                    )
                        ? comicData.categories
                            .filter(
                                Boolean
                            )
                        : [];


                const comicTags =
                    Array.isArray(
                        comicData.tags
                    )
                        ? comicData.tags
                            .filter(
                                Boolean
                            )
                        : [];


                const translationTeams =
                    Array.isArray(
                        comicData.translationTeams
                    )
                        ? comicData.translationTeams
                            .filter(
                                Boolean
                            )
                        : [];


                const detailTags =
                    {};


                if (
                    authors.length >
                    0
                ) {

                    detailTags[
                        "作者"
                    ] =
                        authors;
                }


                if (
                    categories.length >
                    0
                ) {

                    detailTags[
                        "分类"
                    ] =
                        categories;
                }


                if (
                    comicTags.length >
                    0
                ) {

                    detailTags[
                        "标签"
                    ] =
                        comicTags;
                }


                if (
                    translationTeams.length >
                    0
                ) {

                    detailTags[
                        "汉化组"
                    ] =
                        translationTeams;
                }


                /*
                 * =================================================
                 * 更新时间
                 * =================================================
                 */

                let updateTime =
                    undefined;


                if (
                    comicData.updatedAt
                ) {

                    const match =
                        String(
                            comicData.updatedAt
                        ).match(
                            /^(\d{4}-\d{2}-\d{2})/
                        );


                    if (
                        match
                    ) {

                        updateTime =
                            match[1];
                    }
                }


                /*
                 * =================================================
                 * 星级
                 * =================================================
                 */

                let stars =
                    undefined;


                if (
                    typeof comicData.totalLikes ===
                    "number"
                ) {

                    stars =
                        Math.min(
                            5,
                            Math.max(
                                0,
                                comicData.totalLikes /
                                    20
                            )
                        );
                }


                return new ComicDetails({

                    title:
                        comicData.title ||
                        "未知标题",

                    subtitle:
                        authors.join(
                            ", "
                        ),

                    cover:
                        comicData.thumbnailUrl ||
                        "",

                    description:
                        comicData.description ||
                        "",

                    tags:
                        detailTags,

                    chapters:
                        Object.keys(
                            chapters
                        ).length > 0
                            ? chapters
                            : null,

                    updateTime:
                        updateTime,

                    stars:
                        stars,

                    url:
                        `https://app.huakacomic.com/comics/${this.encode(
                            comicData.id ||
                            id
                        )}`
                });
            },


        /*
         * ============================================================
         * 章节图片
         * ============================================================
         */

        loadEp:
            async (
                comicId,
                epId
            ) => {

                if (
                    !epId
                ) {

                    throw (
                        "花咔章节 ID 为空"
                    );
                }


                let realEpisodeId =
                    String(
                        epId
                    );


                if (
                    realEpisodeId.indexOf(
                        "ep_"
                    ) === 0
                ) {

                    realEpisodeId =
                        realEpisodeId.substring(
                            3
                        );
                }


                const images =
                    [];


                let pageToken =
                    null;


                let safety =
                    0;


                while (
                    safety < 100
                ) {

                    safety++;


                    let url =
                        `${this.baseUrl}` +
                        `/comic-pages` +
                        `?episodeId=${this.encode(
                            realEpisodeId
                        )}`;


                    if (
                        pageToken
                    ) {

                        url +=
                            `&pageToken=${this.encode(
                                pageToken
                            )}`;
                    }


                    const response =
                        await this.getJson(
                            url
                        );


                    const data =
                        this.getData(
                            response
                        );


                    const pages =
                        Array.isArray(
                            data.pages
                        )
                            ? data.pages
                            : [];


                    for (
                        const page
                        of pages
                    ) {

                        if (
                            page &&
                            page.mediaUrl
                        ) {

                            images.push(
                                String(
                                    page.mediaUrl
                                )
                            );
                        }
                    }


                    const nextToken =
                        this.getNextPageToken(
                            response
                        );


                    if (
                        !nextToken ||
                        nextToken ===
                            pageToken
                    ) {

                        break;
                    }


                    pageToken =
                        nextToken;
                }


                if (
                    images.length ===
                    0
                ) {

                    throw (
                        "花咔章节没有找到图片"
                    );
                }


                return {

                    images:
                        images
                };
            },


        /*
         * ============================================================
         * 图片
         * ============================================================
         */

        onImageLoad:
            (
                url,
                comicId,
                epId
            ) => {

                return {

                    url:
                        url,

                    headers: {

                        "Referer":
                            "https://app.huakacomic.com/",

                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 10; K) " +
                            "AppleWebKit/537.36 " +
                            "(KHTML, like Gecko) " +
                            "Chrome/140.0.0.0 Mobile Safari/537.36"
                    }
                };
            },


        /*
         * ============================================================
         * 封面
         * ============================================================
         */

        onThumbnailLoad:
            (
                url
            ) => {

                return {

                    url:
                        url,

                    headers: {

                        "Referer":
                            "https://app.huakacomic.com/",

                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 10; K) " +
                            "AppleWebKit/537.36 " +
                            "(KHTML, like Gecko) " +
                            "Chrome/140.0.0.0 Mobile Safari/537.36"
                    }
                };
            },


        /*
         * ============================================================
         * 点击标签
         * ============================================================
         */

        onClickTag:
            (
                namespace,
                tag
            ) => {

                if (
                    !tag
                ) {

                    return null;
                }


                return {

                    page:
                        "search",

                    attributes: {

                        text:
                            String(
                                tag
                            ),

                        options:
                            []
                    }
                };
            }
    };
}
