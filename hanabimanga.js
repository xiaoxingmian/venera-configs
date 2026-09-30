/** @type {import('./_venera_.js')} */

class HanabiManga extends ComicSource {
    name = "花火漫画";
    key = "hanabimanga";
    version = "1.0.0";
    minAppVersion = "1.4.0";

    url = "https://uhkvqrxmcapgtpspglrp.moedot.net";
    baseUrl = "https://uhkvqrxmcapgtpspglrp.moedot.net";

    static ANONYMOUS_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoa3ZxcnhtY2FwZ3Rwc3BnbHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NjgzMjksImV4cCI6MjA3OTU0NDMyOX0.uuHr888lp14ObW5eWowJrHPJGgQf3sF2l7NPmFN84g4";

    static COMIC_BODY =
        "id,title,summary,cover_url,release_date,is_finished,authors,region,latest_chapter_title,tags(id,name),categories(id,name)";

    static PAGE_SIZE = 20;

    static APP_VERSION = "2.4.13";
    static APP_VERSION_CODE = 2041399;

    static CERT_FINGERPRINT =
        "13a8c9fbdaf19115f39b48dc0f3a7c99568ebb0c91ba1a71218c76f53f7877a8";

    static NATIVE_SECRET =
        "7c6cb7f919a688c4c1f5eacf047d97dcd542cae8e3fc84d926160ad879bf3845";

    static TICKET_KEY =
        "bbbd0365d81d8dafda24f7f8d0c16974eaad26faf3610152af92f4571f6dcf45";

    static CATEGORY_MAP = {
        "全部": "",
        "推理": "1",
        "后宫": "2",
        "科幻": "3",
        "百合": "4",
        "恐怖": "5",
        "恋爱": "6",
        "音乐": "7",
        "校园": "8",
        "穿越": "9",
        "战斗": "10",
        "运动": "11",
        "武侠": "12",
        "奇幻": "13",
        "惊悚": "14",
        "搞笑": "15",
        "日常": "16",
        "悬疑": "17",
        "冒险": "18",
        "历史": "19",
        "乙女": "20",
        "美食": "21",
        "职场": "22",
        "玄幻": "23",
        "机战": "24",
        "魔幻": "26",
        "伪娘": "27"
    };

    static REGION_MAP = {
        "全部": "",
        "日漫": "jp",
        "韩漫": "kr",
        "美漫": "us",
        "其他": "others"
    };

    static SORT_MAP = {
        "默认": "id.asc.nullslast",
        "评分最高": "rating_average.desc.nullslast",
        "最近更新": "updated_at.desc.nullslast",
        "最新上架": "created_at.desc.nullslast",
        "日榜": "popularity_daily.desc.nullslast",
        "周榜": "popularity_weekly.desc.nullslast",
        "月榜": "popularity_monthly.desc.nullslast",
        "评分": "rating_average.desc.nullslast",
        "人气": "rating_count.desc.nullslast"
    };

    static STATUS_MAP = {
        "全部": "",
        "连载中": "false",
        "已完结": "true"
    };

    static headers = {
        "apikey": HanabiManga.ANONYMOUS_TOKEN,
        "Content-Type": "application/json"
    };

    async request(method, url, headers = {}, body = null) {
        const h = Object.assign(
            {},
            HanabiManga.headers,
            headers
        );

        let data = body;

        if (
            body !== null &&
            typeof body !== "string"
        ) {
            data = JSON.stringify(body);
        }

        return await Network.sendRequest(
            method,
            url,
            h,
            data
        );
    }

    async getJson(url, headers = {}) {
        const res = await this.request(
            "GET",
            url,
            headers
        );

        if (
            res.status < 200 ||
            res.status >= 300
        ) {
            throw `请求失败: HTTP ${res.status}`;
        }

        try {
            return JSON.parse(res.body);
        } catch (e) {
            throw "服务器返回的数据不是有效 JSON";
        }
    }

    async postJson(url, body, headers = {}) {
        return await this.request(
            "POST",
            url,
            Object.assign(
                {
                    "Content-Type": "application/json"
                },
                headers
            ),
            body
        );
    }

    encode(value) {
        return encodeURIComponent(
            String(value)
        );
    }

    regionName(region) {
        switch (region) {
            case "jp":
                return "日漫";
            case "kr":
                return "韩漫";
            case "us":
                return "美漫";
            default:
                return null;
        }
    }

    parseComic(item) {
        const tags = [];

        if (Array.isArray(item.tags)) {
            for (const tag of item.tags) {
                if (
                    tag &&
                    tag.name
                ) {
                    tags.push(
                        String(tag.name)
                    );
                }
            }
        }

        if (
            item.categories &&
            item.categories.name
        ) {
            tags.push(
                String(
                    item.categories.name
                )
            );
        }

        const region =
            this.regionName(
                item.region
            );

        if (region) {
            tags.push(region);
        }

        let subtitle = "";

        if (
            Array.isArray(
                item.authors
            )
        ) {
            subtitle =
                item.authors.join("，");
        }

        const data = {
            id: String(item.id),
            title: item.title || "",
            subtitle: subtitle,
            subTitle: subtitle,
            cover: item.cover_url || "",
            tags: tags,
            description:
                item.summary
                    ? String(
                          item.summary
                      ).trim()
                    : ""
        };

        return new Comic(data);
    }

    /*
     * ============================================================
     * 登录
     *
     * 这里不再提供“邮箱”和“密码”设置项。
     *
     * Venera 点击源的“登录”后，会把账号密码
     * 传给这里的 login(account, pwd)。
     * ============================================================
     */

    account = {
        login: async (
            account,
            pwd
        ) => {
            if (
                !account ||
                !pwd
            ) {
                throw "请输入邮箱和密码";
            }

            const res =
                await this.postJson(
                    `${this.baseUrl}/auth/v1/token?grant_type=password`,
                    {
                        email: account,
                        password: pwd,
                        gotrue_meta_security: {}
                    }
                );

            if (
                res.status === 400
            ) {
                throw "登录失败，邮箱或密码错误";
            }

            if (
                res.status < 200 ||
                res.status >= 300
            ) {
                throw `登录失败: HTTP ${res.status}`;
            }

            let json;

            try {
                json =
                    JSON.parse(
                        res.body
                    );
            } catch (e) {
                throw "登录失败：服务器返回数据异常";
            }

            if (
                !json.access_token
            ) {
                throw "登录失败：服务器没有返回 Access Token";
            }

            this.saveData(
                "access_token",
                json.access_token
            );

            if (
                json.refresh_token
            ) {
                this.saveData(
                    "refresh_token",
                    json.refresh_token
                );
            }

            if (
                json.expires_at !==
                undefined
            ) {
                this.saveData(
                    "expires_at",
                    json.expires_at
                );
            }

            return "登录成功";
        },

        logout: () => {
            this.deleteData(
                "access_token"
            );

            this.deleteData(
                "refresh_token"
            );

            this.deleteData(
                "expires_at"
            );
        },

        registerWebsite:
            "https://web.hanabimanga.com/zh-CN"
    };

    async getAccessToken() {
        const access =
            this.loadData(
                "access_token"
            );

        if (access) {
            return access;
        }

        const refresh =
            this.loadData(
                "refresh_token"
            );

        if (refresh) {
            try {
                const res =
                    await this.postJson(
                        `${this.baseUrl}/auth/v1/token?grant_type=refresh_token`,
                        {
                            refresh_token:
                                refresh
                        }
                    );

                if (
                    res.status >= 200 &&
                    res.status < 300
                ) {
                    const json =
                        JSON.parse(
                            res.body
                        );

                    if (
                        json.access_token
                    ) {
                        this.saveData(
                            "access_token",
                            json.access_token
                        );
                    }

                    if (
                        json.refresh_token
                    ) {
                        this.saveData(
                            "refresh_token",
                            json.refresh_token
                        );
                    }

                    if (
                        json.expires_at !==
                        undefined
                    ) {
                        this.saveData(
                            "expires_at",
                            json.expires_at
                        );
                    }

                    if (
                        json.access_token
                    ) {
                        return json.access_token;
                    }
                }
            } catch (e) {}
        }

        return HanabiManga.ANONYMOUS_TOKEN;
    }

    /*
     * ============================================================
     * 设置
     *
     * 已删除：
     * 1. 登录邮箱
     * 2. 登录密码
     *
     * 只保留：
     * 1. 热门漫画显示
     * 2. AI 超分辨率
     * ============================================================
     */

    settings = {
        popular: {
            title: "热门漫画显示",
            type: "select",

            options: [
                {
                    value:
                        "popularity_daily.desc.nullslast",
                    text: "日榜"
                },

                {
                    value:
                        "popularity_weekly.desc.nullslast",
                    text: "周榜"
                },

                {
                    value:
                        "popularity_monthly.desc.nullslast",
                    text: "月榜"
                },

                {
                    value:
                        "rating_average.desc.nullslast",
                    text: "评分"
                },

                {
                    value:
                        "rating_count.desc.nullslast",
                    text: "人气"
                }
            ],

            default:
                "popularity_daily.desc.nullslast"
        },

        ai_super_resolution: {
            title: "AI 超分辨率",
            type: "switch",
            default: false
        }
    };

    /*
     * ============================================================
     * 首页
     * ============================================================
     */

    explore = [
        {
            title: "花火漫画",
            type: "multiPartPage",

            load: async (
                page
            ) => {
                const popularOrder =
                    this.loadSetting(
                        "popular"
                    ) ||
                    "popularity_daily.desc.nullslast";

                const popularUrl =
                    `${this.baseUrl}/rest/v1/comics` +
                    `?select=${this.encode(
                        HanabiManga.COMIC_BODY
                    )}` +
                    `&order=${this.encode(
                        popularOrder
                    )}` +
                    `&offset=0&limit=20`;

                const latestUrl =
                    `${this.baseUrl}/rest/v1/comics` +
                    `?select=${this.encode(
                        HanabiManga.COMIC_BODY
                    )}` +
                    `&order=updated_at.desc.nullslast` +
                    `&offset=0&limit=20`;

                const result =
                    await Promise.all([
                        this.getJson(
                            popularUrl
                        ),
                        this.getJson(
                            latestUrl
                        )
                    ]);

                const popular =
                    Array.isArray(
                        result[0]
                    )
                        ? result[0]
                        : [];

                const latest =
                    Array.isArray(
                        result[1]
                    )
                        ? result[1]
                        : [];

                return [
                    {
                        title:
                            "热门漫画",

                        comics:
                            popular.map(
                                (x) =>
                                    this.parseComic(
                                        x
                                    )
                            ),

                        viewMore: {
                            page:
                                "category",

                            attributes: {
                                category:
                                    "全部",

                                param:
                                    null
                            }
                        }
                    },

                    {
                        title:
                            "最近更新",

                        comics:
                            latest.map(
                                (x) =>
                                    this.parseComic(
                                        x
                                    )
                            ),

                        viewMore: {
                            page:
                                "category",

                            attributes: {
                                category:
                                    "全部",

                                param:
                                    JSON.stringify(
                                        {
                                            sort:
                                                "updated_at.desc.nullslast"
                                        }
                                    )
                            }
                        }
                    }
                ];
            }
        }
    ];

/*
 * ============================================================
 * 分类
 *
 * 注意：
 * 这里只显示“分类”
 *
 * “分区”和“状态”不在分类入口显示。
 *
 * 但是进入具体分类后的 categoryComics 页面中：
 * 排序、分区、状态 继续保留。
 * ============================================================
 */

category = {
    title: "花火漫画",

    parts: [
        {
            name: "分类",
            type: "fixed",

            categories:
                Object.keys(
                    HanabiManga.CATEGORY_MAP
                ).map(
                    (
                        name
                    ) => ({
                        label:
                            name,

                        target: {
                            page:
                                "category",

                            attributes: {
                                category:
                                    name,

                                param:
                                    null
                            }
                        }
                    })
                )
        }
    ]
};

    /*
     * ============================================================
     * 分类漫画
     * ============================================================
     */

    categoryComics = {
        optionList: [
            {
                label: "排序",

                options: [
                    "id.asc.nullslast-默认",
                    "rating_average.desc.nullslast-评分最高",
                    "updated_at.desc.nullslast-最近更新",
                    "created_at.desc.nullslast-最新上架"
                ],

                default:
                    "updated_at.desc.nullslast"
            },

            {
                label: "分区",

                options: [
                    "-全部",
                    "jp-日漫",
                    "kr-韩漫",
                    "us-美漫",
                    "others-其他"
                ],

                default: ""
            },

            {
                label: "状态",

                options: [
                    "-全部",
                    "false-连载中",
                    "true-已完结"
                ],

                default: ""
            }
        ],

        load: async (
            category,
            param,
            options,
            page
        ) => {
            let categoryId =
                HanabiManga
                    .CATEGORY_MAP[
                    category
                ];

            if (
                categoryId ===
                undefined
            ) {
                categoryId = "";
            }

            let sort =
                "updated_at.desc.nullslast";

            let region = "";
            let status = "";

            if (
                options &&
                options.length
            ) {
                if (
                    options[0]
                ) {
                    sort =
                        options[0]
                            .split(
                                "-"
                            )[0];
                }

                if (
                    options[1]
                ) {
                    region =
                        options[1]
                            .split(
                                "-"
                            )[0];
                }

                if (
                    options[2]
                ) {
                    status =
                        options[2]
                            .split(
                                "-"
                            )[0];
                }
            }

            if (param) {
                try {
                    const extra =
                        JSON.parse(
                            param
                        );

                    if (
                        extra.region !==
                        undefined
                    ) {
                        region =
                            HanabiManga
                                .REGION_MAP[
                                extra.region
                            ] || "";
                    }

                    if (
                        extra.status !==
                        undefined
                    ) {
                        status =
                            HanabiManga
                                .STATUS_MAP[
                                extra.status
                            ] || "";
                    }

                    if (
                        extra.sort !==
                        undefined
                    ) {
                        sort =
                            extra.sort;
                    }
                } catch (_) {}
            }

            const offset =
                (
                    page - 1
                ) *
                HanabiManga.PAGE_SIZE;

            let url =
                `${this.baseUrl}/rest/v1/comics` +
                `?select=${this.encode(
                    HanabiManga.COMIC_BODY
                )}` +
                `&order=${this.encode(
                    sort
                )}` +
                `&offset=${offset}` +
                `&limit=${HanabiManga.PAGE_SIZE}`;

            if (categoryId) {
                url +=
                    `&category_id=eq.${this.encode(
                        categoryId
                    )}`;
            }

            if (region) {
                url +=
                    `&region=eq.${this.encode(
                        region
                    )}`;
            }

            if (status) {
                url +=
                    `&is_finished=eq.${this.encode(
                        status
                    )}`;
            }

            const list =
                await this.getJson(
                    url
                );

            const sourceList =
                Array.isArray(
                    list
                )
                    ? list
                    : [];

            return {
                comics:
                    sourceList.map(
                        (x) =>
                            this.parseComic(
                                x
                            )
                    ),

                maxPage:
                    sourceList.length ===
                    HanabiManga.PAGE_SIZE
                        ? page + 1
                        : page
            };
        }
    };

    /*
     * ============================================================
     * 搜索
     * ============================================================
     */

    search = {
        load: async (
            keyword,
            options,
            page
        ) => {
            if (
                !keyword ||
                !keyword.trim()
            ) {
                return {
                    comics: [],
                    maxPage: 1
                };
            }

            const res =
                await this.postJson(
                    `${this.baseUrl}/rest/v1/rpc/search_comics_pgroonga`,
                    {
                        search_term:
                            keyword.trim(),

                        items_per_page:
                            String(
                                HanabiManga.PAGE_SIZE
                            ),

                        page_number:
                            String(page)
                    }
                );

            if (
                res.status < 200 ||
                res.status >= 300
            ) {
                throw `搜索失败: HTTP ${res.status}`;
            }

            let list;

            try {
                list =
                    JSON.parse(
                        res.body
                    );
            } catch (e) {
                throw "搜索接口返回数据异常";
            }

            if (
                !Array.isArray(
                    list
                )
            ) {
                list = [];
            }

            return {
                comics:
                    list.map(
                        (x) =>
                            this.parseComic(
                                x
                            )
                    ),

                maxPage:
                    list.length ===
                    HanabiManga.PAGE_SIZE
                        ? page + 1
                        : page
            };
        },

        optionList: []
    };

    /*
     * ============================================================
     * 漫画详情
     * ============================================================
     */

    comic = {
        loadInfo: async (
            id
        ) => {
            const select =
                `${HanabiManga.COMIC_BODY},` +
                `chapters(id,idx,title,image_count,category,updated_at)`;

            const url =
                `${this.baseUrl}/rest/v1/comics` +
                `?id=eq.${this.encode(
                    String(id)
                )}` +
                `&select=${this.encode(
                    select
                )}`;

            const list =
                await this.getJson(
                    url
                );

            if (
                !list ||
                !list.length
            ) {
                throw "漫画不存在";
            }

            const item =
                list[0];

            const chapters = {};

            const chapterList =
                Array.isArray(
                    item.chapters
                )
                    ? item.chapters
                    : [];

            chapterList.sort(
                (
                    a,
                    b
                ) => {
                    const av =
                        a.category ===
                        "volume"
                            ? 1
                            : 0;

                    const bv =
                        b.category ===
                        "volume"
                            ? 1
                            : 0;

                    if (
                        av !==
                        bv
                    ) {
                        return (
                            av -
                            bv
                        );
                    }

                    return (
                        Number(
                            b.idx ||
                                0
                        ) -
                        Number(
                            a.idx ||
                                0
                        )
                    );
                }
            );

            chapterList.forEach(
                (
                    chapter
                ) => {
                    let name =
                        chapter.title ||
                        "";

                    if (
                        chapter.category ===
                        "normal"
                    ) {
                        name +=
                            " [连载]";
                    } else if (
                        chapter.category ===
                        "special"
                    ) {
                        name +=
                            " [特典番外]";
                    } else if (
                        chapter.category ===
                        "volume"
                    ) {
                        name +=
                            " [单行本]";
                    }

                    chapters[
                        String(
                            chapter.id
                        )
                    ] = name;
                }
            );

            const tags = {};

            if (
                Array.isArray(
                    item.tags
                ) &&
                item.tags.length
            ) {
                tags["标签"] =
                    item.tags
                        .filter(
                            (
                                x
                            ) =>
                                x &&
                                x.name
                        )
                        .map(
                            (
                                x
                            ) =>
                                x.name
                        );
            }

            if (
                item.categories &&
                item.categories.name
            ) {
                tags["分类"] = [
                    item.categories.name
                ];
            }

            const region =
                this.regionName(
                    item.region
                );

            if (region) {
                tags["分区"] = [
                    region
                ];
            }

            let author = "";

            if (
                Array.isArray(
                    item.authors
                )
            ) {
                author =
                    item.authors.join(
                        "，"
                    );
            }

            const recommend =
                await this.loadRecommend(
                    item
                );

            return new ComicDetails({
                title:
                    item.title ||
                    "",

                subtitle:
                    author,

                subTitle:
                    author,

                cover:
                    item.cover_url ||
                    "",

                description:
                    item.summary
                        ? String(
                              item.summary
                          ).trim()
                        : "",

                tags:
                    tags,

                chapters:
                    chapters,

                recommend:
                    recommend,

                updateTime:
                    item.release_date ||
                    undefined,

                url:
                    `https://web.hanabimanga.com/zh-CN/comic/${id}`
            });
        },

        /*
         * ========================================================
         * 章节图片
         * ========================================================
         */

        loadEp: async (
            comicId,
            epId
        ) => {
            if (
                epId ===
                    undefined ||
                epId ===
                    null ||
                String(
                    epId
                ).trim() ===
                    ""
            ) {
                throw "章节 ID 不存在";
            }

            const chapter =
                await this.getChapter(
                    comicId,
                    epId
                );

            let imageCount =
                Number(
                    chapter.image_count
                );

            if (
                !Number.isFinite(
                    imageCount
                ) ||
                imageCount <= 0
            ) {
                imageCount =
                    Number(
                        chapter.size
                    );
            }

            if (
                !Number.isFinite(
                    imageCount
                ) ||
                imageCount <= 0
            ) {
                throw "章节没有获取到图片数量";
            }

            const pages = [];

            for (
                let i = 0;
                i < imageCount;
                i++
            ) {
                pages.push(
                    String(
                        i + 1
                    ).padStart(
                        3,
                        "0"
                    )
                );
            }

            const timestamp =
                Math.floor(
                    Date.now() /
                        1000
                );

            const canonical =
                `v1|comic_id=${comicId}` +
                `|chapter_id=${epId}` +
                `|pages=${pages.join(
                    ","
                )}` +
                `|timestamp=${timestamp}`;

            const signature =
                this.makeSignature(
                    canonical
                );

            if (
                !signature ||
                typeof signature !==
                    "string"
            ) {
                throw "签名生成失败";
            }

            const token =
                await this.getAccessToken();

            const setting =
                this.loadSetting(
                    "ai_super_resolution"
                );

            const ai =
                setting === true ||
                setting === "true";

            const endpoint =
                ai
                    ? "vip-image-url"
                    : "sd-image-url";

            const body = {
                comic_id:
                    Number(
                        comicId
                    ),

                chapter_id:
                    String(
                        epId
                    ),

                pages:
                    pages,

                timestamp:
                    timestamp,

                signature:
                    signature,

                client_diag: {
                    native_status:
                        "ok",

                    native_fingerprint_prefix:
                        HanabiManga
                            .CERT_FINGERPRINT
                            .slice(
                                0,
                                8
                            ),

                    canonical_payload_sha256:
                        this.sha256Hex(
                            Convert.encodeUtf8(
                                canonical
                            )
                        ),

                    signature_prefix:
                        signature.slice(
                            0,
                            16
                        ),

                    app_version:
                        HanabiManga.APP_VERSION,

                    app_version_code:
                        HanabiManga.APP_VERSION_CODE,

                    brand:
                        "Venera",

                    manufacturer:
                        "Venera",

                    model:
                        "Venera",

                    product:
                        "Venera",

                    sdk_int:
                        0
                }
            };

            const res =
                await this.postJson(
                    `${this.baseUrl}/functions/v1/${endpoint}`,
                    body,
                    {
                        Authorization:
                            `Bearer ${token}`
                    }
                );

            if (
                res.status ===
                401
            ) {
                throw "请先在插件登录界面登录";
            }

            if (
                res.status ===
                429
            ) {
                let error =
                    null;

                try {
                    error =
                        JSON.parse(
                            res.body
                        );
                } catch (e) {}

                if (
                    error &&
                    error.code ===
                        "ANON_QUOTA_EXCEEDED"
                ) {
                    throw "请先在插件登录界面登录";
                }

                if (
                    error &&
                    error.code ===
                        "FREE_QUOTA_EXCEEDED"
                ) {
                    throw "今日超分额度已用完";
                }

                throw "请求频率过高";
            }

            if (
                res.status < 200 ||
                res.status >= 300
            ) {
                throw `图片接口失败: HTTP ${res.status}`;
            }

            let result;

            try {
                result =
                    JSON.parse(
                        res.body
                    );
            } catch (e) {
                throw "图片接口返回数据异常";
            }

            const urls =
                Array.isArray(
                    result.urls
                )
                    ? result.urls
                    : [];

            if (
                !urls.length
            ) {
                throw "图片接口没有返回图片";
            }

            /*
             * 没有混淆，直接返回。
             */

            if (
                !result.scrambleInfo
            ) {
                return {
                    images:
                        urls
                            .map(
                                (
                                    x
                                ) => {
                                    if (
                                        typeof x ===
                                        "string"
                                    ) {
                                        return x;
                                    }

                                    return x &&
                                        x.url
                                        ? x.url
                                        : "";
                                }
                            )
                            .filter(
                                (
                                    x
                                ) => x
                            )
                };
            }

            /*
             * ====================================================
             * 图片存在切片混淆
             * ====================================================
             */

            const info =
                result.scrambleInfo;

            const ticket =
                info.ticket;

            const nonce =
                info.nonce;

            const cols =
                Number(
                    info.cols
                );

            const rows =
                Number(
                    info.rows
                );

            if (
                !ticket ||
                !nonce ||
                !cols ||
                !rows
            ) {
                throw "图片混淆参数无效";
            }

            const seed =
                this.decryptTicket(
                    ticket,
                    nonce
                );

            const permutation =
                this.makePermutation(
                    seed,
                    cols * rows
                );

            const fragment =
                `#hanabi|${cols}|${rows}|${permutation.join(
                    ","
                )}`;

            return {
                images:
                    urls
                        .map(
                            (
                                x
                            ) => {
                                let imageUrl =
                                    "";

                                if (
                                    typeof x ===
                                    "string"
                                ) {
                                    imageUrl =
                                        x;
                                } else if (
                                    x &&
                                    x.url
                                ) {
                                    imageUrl =
                                        x.url;
                                }

                                if (
                                    !imageUrl
                                ) {
                                    return "";
                                }

                                return (
                                    imageUrl +
                                    fragment
                                );
                            }
                        )
                        .filter(
                            (
                                x
                            ) => x
                        )
            };
        },

        /*
         * ========================================================
         * 图片解混淆
         * ========================================================
         */

        onImageLoad: (
            url,
            comicId,
            epId
        ) => {
            if (
                !url ||
                !url.includes(
                    "#hanabi|"
                )
            ) {
                return {};
            }

            const marker =
                "#hanabi|";

            const pos =
                url.indexOf(
                    marker
                );

            if (
                pos < 0
            ) {
                return {};
            }

            const hash =
                url.substring(
                    pos +
                        marker.length
                );

            const parts =
                hash.split(
                    "|"
                );

            if (
                parts.length !==
                3
            ) {
                return {};
            }

            const cols =
                Number(
                    parts[0]
                );

            const rows =
                Number(
                    parts[1]
                );

            const permutation =
                parts[2]
                    .split(",")
                    .map(
                        (
                            x
                        ) =>
                            Number(
                                x
                            )
                    );

            if (
                !cols ||
                !rows ||
                !permutation.length
            ) {
                return {};
            }

            const modifyImage = `
function modifyImage(image) {
    const cols = ${cols};
    const rows = ${rows};
    const perm = [${permutation.join(",")}];

    const width = image.width;
    const height = image.height;

    const output = Image.empty(
        width,
        height
    );

    function tileRect(index) {
        const col =
            index % cols;

        const row =
            Math.floor(
                index / cols
            );

        const x0 =
            Math.floor(
                col *
                width /
                cols
            );

        const x1 =
            Math.floor(
                (col + 1) *
                width /
                cols
            );

        const y0 =
            Math.floor(
                row *
                height /
                rows
            );

        const y1 =
            Math.floor(
                (row + 1) *
                height /
                rows
            );

        return {
            x: x0,
            y: y0,
            w: x1 - x0,
            h: y1 - y0
        };
    }

    for (
        let dest = 0;
        dest < perm.length;
        dest++
    ) {
        const source =
            perm[dest];

        if (
            source ===
                undefined ||
            source < 0
        ) {
            continue;
        }

        const st =
            tileRect(
                source
            );

        const dt =
            tileRect(
                dest
            );

        const copyW =
            Math.min(
                st.w,
                dt.w
            );

        const copyH =
            Math.min(
                st.h,
                dt.h
            );

        if (
            copyW <= 0 ||
            copyH <= 0
        ) {
            continue;
        }

        output.fillImageRangeAt(
            dt.x,
            dt.y,
            image,
            st.x,
            st.y,
            copyW,
            copyH
        );
    }

    return output;
}
`;

            return {
                modifyImage:
                    modifyImage
            };
        }
    };

    /*
     * ============================================================
     * 获取章节
     * ============================================================
     */

    async getChapter(
        comicId,
        chapterId
    ) {
        const select =
            "id,idx,title,category,updated_at,image_count";

        const url =
            `${this.baseUrl}/rest/v1/comics` +
            `?id=eq.${this.encode(
                String(
                    comicId
                )
            )}` +
            `&select=${this.encode(
                `chapters(${select})`
            )}`;

        const list =
            await this.getJson(
                url
            );

        if (
            !list ||
            !list.length
        ) {
            throw "漫画不存在";
        }

        const chapters =
            Array.isArray(
                list[0].chapters
            )
                ? list[0].chapters
                : [];

        const chapter =
            chapters.find(
                (
                    x
                ) =>
                    String(
                        x.id
                    ) ===
                    String(
                        chapterId
                    )
            );

        if (!chapter) {
            throw "章节不存在";
        }

        return chapter;
    }

    /*
     * ============================================================
     * 推荐
     * ============================================================
     */

    async loadRecommend(
        comic
    ) {
        if (
            !comic.categories ||
            comic.categories.id ===
                undefined ||
            comic.categories.id ===
                null
        ) {
            return [];
        }

        const res =
            await this.postJson(
                `${this.baseUrl}/rest/v1/rpc/get_random_comics`,
                {
                    p_limit: 9,

                    p_category_id:
                        Number(
                            comic
                                .categories
                                .id
                        ),

                    p_exclude_comic_id:
                        Number(
                            comic.id
                        )
                }
            );

        if (
            res.status < 200 ||
            res.status >= 300
        ) {
            return [];
        }

        try {
            const list =
                JSON.parse(
                    res.body
                );

            if (
                !Array.isArray(
                    list
                )
            ) {
                return [];
            }

            return list.map(
                (
                    x
                ) =>
                    this.parseComic(
                        x
                    )
            );
        } catch (_) {
            return [];
        }
    }

    /*
     * ============================================================
     * 工具：Hex
     * ============================================================
     */

    hexToBytes(
        hex
    ) {
        if (
            typeof hex !==
            "string"
        ) {
            throw "十六进制数据类型错误";
        }

        if (
            hex.length %
                2 !==
            0
        ) {
            throw "十六进制数据长度错误";
        }

        const out =
            new Uint8Array(
                hex.length / 2
            );

        for (
            let i = 0;
            i < out.length;
            i++
        ) {
            const value =
                parseInt(
                    hex.substr(
                        i * 2,
                        2
                    ),
                    16
                );

            if (
                Number.isNaN(
                    value
                )
            ) {
                throw "十六进制数据无效";
            }

            out[i] =
                value;
        }

        return out;
    }

    concatBytes(
        a,
        b
    ) {
        const out =
            new Uint8Array(
                a.byteLength +
                    b.byteLength
            );

        out.set(
            a,
            0
        );

        out.set(
            b,
            a.byteLength
        );

        return out;
    }

    toArrayBuffer(
        value
    ) {
        if (
            value instanceof
            ArrayBuffer
        ) {
            return value;
        }

        if (
            value &&
            value.buffer instanceof
                ArrayBuffer
        ) {
            return value.buffer.slice(
                value.byteOffset,
                value.byteOffset +
                    value.byteLength
            );
        }

        throw "无法转换为 ArrayBuffer";
    }

    /*
     * ============================================================
     * SHA256
     * ============================================================
     */

    sha256Hex(
        bytes
    ) {
        try {
            const buffer =
                this.toArrayBuffer(
                    bytes
                );

            const hash =
                Convert.sha256(
                    buffer
                );

            return Convert.hexEncode(
                this.toArrayBuffer(
                    hash
                )
            );
        } catch (
            e
        ) {
            throw `SHA256 计算失败: ${
                e &&
                e.message
                    ? e.message
                    : String(e)
            }`;
        }
    }

    /*
     * ============================================================
     * 签名
     * ============================================================
     */

    makeSignature(
        payload
    ) {
        try {
            const secret =
                this.hexToBytes(
                    HanabiManga.NATIVE_SECRET
                );

            const fingerprint =
                this.hexToBytes(
                    HanabiManga.CERT_FINGERPRINT
                );

            const keyInput =
                this.concatBytes(
                    secret,
                    fingerprint
                );

            const key =
                Convert.sha256(
                    this.toArrayBuffer(
                        keyInput
                    )
                );

            const payloadBuffer =
                Convert.encodeUtf8(
                    String(
                        payload
                    )
                );

            const signature =
                Convert.hmacString(
                    this.toArrayBuffer(
                        key
                    ),
                    this.toArrayBuffer(
                        payloadBuffer
                    ),
                    "sha256"
                );

            if (
                typeof signature !==
                "string"
            ) {
                throw "HMAC-SHA256 没有返回字符串";
            }

            return signature;
        } catch (
            e
        ) {
            throw `签名密钥计算失败: ${
                e &&
                e.message
                    ? e.message
                    : String(e)
            }`;
        }
    }

    /*
     * ============================================================
     * Ticket AES-GCM 解密
     * ============================================================
     */

    decryptTicket(
        ticketB64,
        nonceB64
    ) {
        let ticketRaw;
        let nonceRaw;

        try {
            ticketRaw =
                Convert.decodeBase64(
                    ticketB64
                );

            nonceRaw =
                Convert.decodeBase64(
                    nonceB64
                );
        } catch (
            e
        ) {
            throw `Ticket Base64 解码失败: ${
                e &&
                e.message
                    ? e.message
                    : String(e)
            }`;
        }

        const ticket =
            new Uint8Array(
                this.toArrayBuffer(
                    ticketRaw
                )
            );

        const nonce =
            new Uint8Array(
                this.toArrayBuffer(
                    nonceRaw
                )
            );

        if (
            nonce.length !==
            12
        ) {
            throw "ticket nonce 长度错误";
        }

        if (
            ticket.length <
            17
        ) {
            throw "ticket 长度错误";
        }

        const ciphertext =
            ticket.slice(
                0,
                ticket.length -
                    16
            );

        const tag =
            ticket.slice(
                ticket.length -
                    16
            );

        const key =
            this.hexToBytes(
                HanabiManga.TICKET_KEY
            );

        return this.aesGcmDecrypt(
            key,
            nonce,
            ciphertext,
            tag
        ).reduce(
            (
                result,
                byte
            ) =>
                result +
                String.fromCharCode(
                    byte
                ),
            ""
        );
    }

    /*
     * ============================================================
     * AES SBOX
     * ============================================================
     */

    AES_SBOX =
        new Uint8Array([
            99,124,119,123,242,107,111,197,
            48,1,103,43,254,215,171,118,
            202,130,201,125,250,89,71,240,
            173,212,162,175,156,164,114,192,
            183,253,147,38,54,63,247,204,
            52,165,229,241,113,216,49,21,
            4,199,35,195,24,150,5,154,
            7,18,128,226,235,39,178,117,
            9,131,44,26,27,110,90,160,
            82,59,214,179,41,227,47,132,
            83,209,0,237,32,252,177,91,
            106,203,190,57,74,76,88,207,
            208,239,170,251,67,77,51,133,
            69,249,2,127,80,60,159,168,
            81,163,64,143,146,157,56,245,
            188,182,218,33,16,255,243,210,
            205,12,19,236,95,151,68,23,
            196,167,126,61,100,93,25,115,
            96,129,79,220,34,42,144,136,
            70,238,184,20,222,94,11,219,
            224,50,58,10,73,6,36,92,
            194,211,172,98,145,149,228,121,
            231,200,55,109,141,213,78,169,
            108,86,244,234,101,122,174,8,
            186,120,37,46,28,166,180,198,
            232,221,116,31,75,189,139,138,
            112,62,181,102,72,3,246,14,
            97,53,87,185,134,193,29,158,
            225,248,152,17,105,217,142,148,
            155,30,135,233,206,85,40,223,
            140,161,137,13,191,230,66,104,
            65,153,45,15,176,84,187,22
        ]);

    aesXtime(
        x
    ) {
        return (
            (
                (
                    x << 1
                ) ^
                (
                    x & 128
                        ? 0x1b
                        : 0
                )
            ) &
            255
        );
    }

    aesExpandKey(
        key
    ) {
        const nk =
            key.length /
            4;

        const nr =
            nk + 6;

        const expanded =
            new Uint8Array(
                16 *
                    (
                        nr + 1
                    )
            );

        expanded.set(
            key
        );

        let bytes =
            nk * 4;

        let rcon =
            1;

        const temp =
            new Uint8Array(
                4
            );

        while (
            bytes <
            expanded.length
        ) {
            for (
                let i = 0;
                i < 4;
                i++
            ) {
                temp[i] =
                    expanded[
                        bytes -
                            4 +
                            i
                    ];
            }

            if (
                bytes %
                    (
                        nk * 4
                    ) ===
                0
            ) {
                const t =
                    temp[0];

                temp[0] =
                    this.AES_SBOX[
                        temp[1]
                    ] ^
                    rcon;

                temp[1] =
                    this.AES_SBOX[
                        temp[2]
                    ];

                temp[2] =
                    this.AES_SBOX[
                        temp[3]
                    ];

                temp[3] =
                    this.AES_SBOX[
                        t
                    ];

                rcon =
                    this.aesXtime(
                        rcon
                    );
            }

            for (
                let i = 0;
                i < 4;
                i++
            ) {
                expanded[
                    bytes
                ] =
                    expanded[
                        bytes -
                            nk *
                                4
                    ] ^
                    temp[i];

                bytes++;
            }
        }

        return {
            key:
                expanded,

            rounds:
                nr
        };
    }

    aesEncryptBlock(
        input,
        key
    ) {
        const expanded =
            this.aesExpandKey(
                key
            );

        const w =
            expanded.key;

        const nr =
            expanded.rounds;

        const state =
            new Uint8Array(
                input
            );

        const addRoundKey =
            (
                round
            ) => {
                for (
                    let i = 0;
                    i < 16;
                    i++
                ) {
                    state[i] ^=
                        w[
                            round *
                                16 +
                                i
                        ];
                }
            };

        const subBytes =
            () => {
                for (
                    let i = 0;
                    i < 16;
                    i++
                ) {
                    state[i] =
                        this.AES_SBOX[
                            state[i]
                        ];
                }
            };

        const shiftRows =
            () => {
                const tmp =
                    state.slice();

                for (
                    let row = 0;
                    row < 4;
                    row++
                ) {
                    for (
                        let col = 0;
                        col < 4;
                        col++
                    ) {
                        state[
                            4 *
                                col +
                                row
                        ] =
                            tmp[
                                4 *
                                    (
                                        (
                                            col +
                                            row
                                        ) %
                                        4
                                    ) +
                                    row
                            ];
                    }
                }
            };

        const mixColumns =
            () => {
                for (
                    let col = 0;
                    col < 4;
                    col++
                ) {
                    const i =
                        col * 4;

                    const a =
                        state[i];

                    const b =
                        state[
                            i + 1
                        ];

                    const c =
                        state[
                            i + 2
                        ];

                    const d =
                        state[
                            i + 3
                        ];

                    const q =
                        a ^
                        b ^
                        c ^
                        d;

                    state[i] =
                        a ^
                        q ^
                        this.aesXtime(
                            a ^ b
                        );

                    state[
                        i + 1
                    ] =
                        b ^
                        q ^
                        this.aesXtime(
                            b ^ c
                        );

                    state[
                        i + 2
                    ] =
                        c ^
                        q ^
                        this.aesXtime(
                            c ^ d
                        );

                    state[
                        i + 3
                    ] =
                        d ^
                        q ^
                        this.aesXtime(
                            d ^ a
                        );
                }
            };

        addRoundKey(
            0
        );

        for (
            let round = 1;
            round < nr;
            round++
        ) {
            subBytes();
            shiftRows();
            mixColumns();
            addRoundKey(
                round
            );
        }

        subBytes();
        shiftRows();
        addRoundKey(
            nr
        );

        return state;
    }

    xorBytes(
        a,
        b
    ) {
        const out =
            new Uint8Array(
                a.length
            );

        for (
            let i = 0;
            i < a.length;
            i++
        ) {
            out[i] =
                a[i] ^
                b[i];
        }

        return out;
    }

    concatMany(
        ...arrays
    ) {
        let size = 0;

        for (
            const a of arrays
        ) {
            size +=
                a.length;
        }

        const out =
            new Uint8Array(
                size
            );

        let pos = 0;

        for (
            const a of arrays
        ) {
            out.set(
                a,
                pos
            );

            pos +=
                a.length;
        }

        return out;
    }

    /*
     * ============================================================
     * Galois Field
     * ============================================================
     */

    gfMultiply(
        x,
        y
    ) {
        const z =
            new Uint8Array(
                16
            );

        let v =
            y.slice();

        for (
            let i = 0;
            i < 128;
            i++
        ) {
            if (
                (
                    x[
                        Math.floor(
                            i / 8
                        )
                    ] >>
                    (
                        7 -
                        (
                            i % 8
                        )
                    )
                ) &
                1
            ) {
                for (
                    let j = 0;
                    j < 16;
                    j++
                ) {
                    z[j] ^=
                        v[j];
                }
            }

            const lsb =
                v[15] &
                1;

            for (
                let j = 15;
                j > 0;
                j--
            ) {
                v[j] =
                    (
                        v[j] >>>
                        1
                    ) |
                    (
                        (
                            v[
                                j - 1
                            ] &
                            1
                        ) <<
                        7
                    );
            }

            /*
             * 这里必须是：
             *
             * v[0] >>>= 1;
             *
             * 不要拆开。
             */
            v[0] >>>= 1;

            if (lsb) {
                v[0] ^=
                    0xe1;
            }
        }

        return z;
    }

    ghash(
        h,
        data
    ) {
        let y =
            new Uint8Array(
                16
            );

        for (
            let pos = 0;
            pos < data.length;
            pos += 16
        ) {
            const block =
                new Uint8Array(
                    16
                );

            block.set(
                data.slice(
                    pos,
                    pos + 16
                )
            );

            y =
                this.gfMultiply(
                    this.xorBytes(
                        y,
                        block
                    ),
                    h
                );
        }

        return y;
    }

    inc32(
        block
    ) {
        const out =
            block.slice();

        let n =
            (
                (
                    out[12] <<
                    24
                ) |
                (
                    out[13] <<
                    16
                ) |
                (
                    out[14] <<
                    8
                ) |
                out[15]
            ) >>> 0;

        n =
            (
                n + 1
            ) >>> 0;

        out[12] =
            n >>> 24;

        out[13] =
            (
                n >>> 16
            ) &
            255;

        out[14] =
            (
                n >>> 8
            ) &
            255;

        out[15] =
            n &
            255;

        return out;
    }

    aesGcmDecrypt(
        key,
        nonce,
        ciphertext,
        tag
    ) {
        const h =
            this.aesEncryptBlock(
                new Uint8Array(
                    16
                ),
                key
            );

        const j0 =
            this.concatMany(
                nonce,
                new Uint8Array(
                    [
                        0,
                        0,
                        0,
                        1
                    ]
                )
            );

        const paddedLength =
            Math.ceil(
                ciphertext.length /
                    16
            ) * 16;

        const auth =
            new Uint8Array(
                paddedLength +
                    16
            );

        auth.set(
            ciphertext
        );

        const bitLength =
            ciphertext.length *
            8;

        const hi =
            Math.floor(
                bitLength /
                    4294967296
            );

        const lo =
            bitLength >>>
            0;

        const p =
            auth.length -
            8;

        auth[p] =
            hi >>> 24;

        auth[p + 1] =
            (
                hi >>> 16
            ) &
            255;

        auth[p + 2] =
            (
                hi >>> 8
            ) &
            255;

        auth[p + 3] =
            hi &
            255;

        auth[p + 4] =
            lo >>> 24;

        auth[p + 5] =
            (
                lo >>> 16
            ) &
            255;

        auth[p + 6] =
            (
                lo >>> 8
            ) &
            255;

        auth[p + 7] =
            lo &
            255;

        const s =
            this.ghash(
                h,
                auth
            );

        const expected =
            this.xorBytes(
                this.aesEncryptBlock(
                    j0,
                    key
                ),
                s
            );

        if (
            tag.length !==
            16
        ) {
            throw "ticket GCM 标签长度错误";
        }

        for (
            let i = 0;
            i < 16;
            i++
        ) {
            if (
                expected[i] !==
                tag[i]
            ) {
                throw "ticket 校验失败";
            }
        }

        const output =
            new Uint8Array(
                ciphertext.length
            );

        let counter =
            j0;

        for (
            let pos = 0;
            pos <
            ciphertext.length;
            pos += 16
        ) {
            counter =
                this.inc32(
                    counter
                );

            const stream =
                this.aesEncryptBlock(
                    counter,
                    key
                );

            const size =
                Math.min(
                    16,
                    ciphertext.length -
                        pos
                );

            for (
                let i = 0;
                i < size;
                i++
            ) {
                output[
                    pos + i
                ] =
                    ciphertext[
                        pos + i
                    ] ^
                    stream[i];
            }
        }

        return output;
    }

    /*
     * ============================================================
     * ChaCha8
     * ============================================================
     */

    rotl32(
        x,
        n
    ) {
        return (
            (
                x << n
            ) |
            (
                x >>>
                (
                    32 - n
                )
            )
        );
    }

    readIntLE(
        bytes,
        offset
    ) {
        return (
            bytes[offset] |
            (
                bytes[
                    offset + 1
                ] <<
                8
            ) |
            (
                bytes[
                    offset + 2
                ] <<
                16
            ) |
            (
                bytes[
                    offset + 3
                ] <<
                24
            )
        );
    }

    chachaQuarterRound(
        s,
        a,
        b,
        c,
        d
    ) {
        s[a] =
            (
                s[a] +
                s[b]
            ) |
            0;

        s[d] =
            this.rotl32(
                s[d] ^
                s[a],
                16
            );

        s[c] =
            (
                s[c] +
                s[d]
            ) |
            0;

        s[b] =
            this.rotl32(
                s[b] ^
                s[c],
                12
            );

        s[a] =
            (
                s[a] +
                s[b]
            ) |
            0;

        s[d] =
            this.rotl32(
                s[d] ^
                s[a],
                8
            );

        s[c] =
            (
                s[c] +
                s[d]
            ) |
            0;

        s[b] =
            this.rotl32(
                s[b] ^
                s[c],
                7
            );
    }

    chachaBlock(
        key,
        counterLo,
        counterHi
    ) {
        const constants = [
            0x61707865,
            0x3320646e,
            0x79622d32,
            0x6b206574
        ];

        const base =
            new Int32Array(
                16
            );

        for (
            let i = 0;
            i < 4;
            i++
        ) {
            base[i] =
                constants[i];
        }

        for (
            let i = 0;
            i < 8;
            i++
        ) {
            base[
                4 + i
            ] =
                this.readIntLE(
                    key,
                    i * 4
                );
        }

        base[12] =
            counterLo |
            0;

        base[13] =
            counterHi |
            0;

        base[14] =
            0;

        base[15] =
            0;

        const x =
            new Int32Array(
                base
            );

        for (
            let i = 0;
            i < 4;
            i++
        ) {
            this.chachaQuarterRound(
                x,
                0,
                4,
                8,
                12
            );

            this.chachaQuarterRound(
                x,
                1,
                5,
                9,
                13
            );

            this.chachaQuarterRound(
                x,
                2,
                6,
                10,
                14
            );

            this.chachaQuarterRound(
                x,
                3,
                7,
                11,
                15
            );

            this.chachaQuarterRound(
                x,
                0,
                5,
                10,
                15
            );

            this.chachaQuarterRound(
                x,
                1,
                6,
                11,
                12
            );

            this.chachaQuarterRound(
                x,
                2,
                7,
                8,
                13
            );

            this.chachaQuarterRound(
                x,
                3,
                4,
                9,
                14
            );
        }

        const out =
            new Uint32Array(
                16
            );

        for (
            let i = 0;
            i < 16;
            i++
        ) {
            out[i] =
                (
                    x[i] +
                    base[i]
                ) >>> 0;
        }

        return out;
    }

    makePermutation(
        seedAscii,
        tileCount
    ) {
        const encoded =
            Convert.encodeUtf8(
                String(
                    seedAscii
                )
            );

        const hash =
            Convert.sha256(
                this.toArrayBuffer(
                    encoded
                )
            );

        const seedHash =
            new Uint8Array(
                this.toArrayBuffer(
                    hash
                )
            );

        const arr =
            new Array(
                tileCount
            );

        for (
            let i = 0;
            i < tileCount;
            i++
        ) {
            arr[i] =
                i;
        }

        let counterLo =
            0;

        let counterHi =
            0;

        let block =
            new Uint32Array(
                16
            );

        let blockPos =
            16;

        const nextUInt32 =
            () => {
                if (
                    blockPos ===
                    16
                ) {
                    block =
                        this.chachaBlock(
                            seedHash,
                            counterLo,
                            counterHi
                        );

                    counterLo =
                        (
                            counterLo +
                            1
                        ) >>> 0;

                    if (
                        counterLo ===
                        0
                    ) {
                        counterHi =
                            (
                                counterHi +
                                1
                            ) >>> 0;
                    }

                    blockPos =
                        0;
                }

                return (
                    block[
                        blockPos++
                    ] >>> 0
                );
            };

        for (
            let len =
                tileCount;
            len >= 2;
            len--
        ) {
            const random =
                nextUInt32();

            const j =
                random %
                len;

            const i =
                len - 1;

            const temp =
                arr[i];

            arr[i] =
                arr[j];

            arr[j] =
                temp;
        }

        const d2s =
            new Array(
                tileCount
            );

        for (
            let source = 0;
            source <
            tileCount;
            source++
        ) {
            const dest =
                arr[source];

            d2s[dest] =
                source;
        }

        return d2s;
    }
}
