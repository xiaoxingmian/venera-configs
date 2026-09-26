/** @type {import('./_venera_.js')} */
class Manwa extends ComicSource {
  name = "漫蛙";
  key = "manwa";
  version = "1.0.0";
  minAppVersion = "1.4.0";

  url =
    "https://gh-proxy.com/raw.githubusercontent.com/xiaoxingmian/venera-configs/refs/heads/main/index.json";

  static ua =
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

  #domain_key = "manwa_domain";

  #defaultDomains = [
    "https://manwa.me",
    "https://manwass.cc",
    "https://manwatg.cc",
    "shturl.cc/l43Qd1Vu",
    "https://manwasy.cc",
  ];

  // =========================
  // 域名
  // =========================

  get domain() {
    return this.loadData(this.#domain_key) || this.#defaultDomains[0];
  }

  // =========================
  // User-Agent
  // =========================

  get ua() {
    return this.loadSetting("ua") || Manwa.ua;
  }

  // =========================
  // 构建 URL
  // =========================

  buildUrl(path) {
    if (path.startsWith("/")) {
      path = path.substring(1);
    }

    return `${this.domain}/${path}`;
  }

  // =========================
  // Cache Implementation
  // =========================

  async _withCache(key, fetcher) {
    const enableCache = this.loadSetting("enableCache");

    if (!enableCache) {
      return await fetcher();
    }

    const durationHours = parseFloat(
      this.loadSetting("cacheDuration") || "1",
    );

    const CACHE_DURATION = durationHours * 60 * 60 * 1000;

    const get = (obj, p) =>
      p.split(".").reduce((acc, part) => acc && acc[part], obj);

    const timestamps = this.loadData("cache_timestamps") || {};
    const cachedTimestamp = get(timestamps, key);

    const data = this.loadData("cache_data") || {};
    const cachedData = get(data, key);

    if (cachedTimestamp && cachedData) {
      const isExpired =
        Date.now() - cachedTimestamp > CACHE_DURATION;

      if (!isExpired) {
        console.log(`[Cache] HIT: ${key}`);
        return cachedData;
      }
    }

    try {
      console.log(
        `[Cache] ${cachedTimestamp ? "EXPIRED" : "MISS"}: ${key}. Fetching...`,
      );

      const newData = await fetcher();

      const set = (obj, p, val) => {
        const parts = p.split(".");
        const last = parts.pop();

        let current = obj;

        for (const part of parts) {
          if (!current[part]) {
            current[part] = {};
          }

          current = current[part];
        }

        current[last] = val;

        return obj;
      };

      let allTimestamps =
        this.loadData("cache_timestamps") || {};

      let allData =
        this.loadData("cache_data") || {};

      let allKeys =
        this.loadData("cache_keys") || {};

      set(allTimestamps, key, Date.now());
      set(allData, key, newData);
      set(allKeys, key, true);

      this.saveData(
        "cache_timestamps",
        allTimestamps,
      );

      this.saveData(
        "cache_data",
        allData,
      );

      this.saveData(
        "cache_keys",
        allKeys,
      );

      return newData;
    } catch (e) {
      console.error(
        `[Cache] FETCH FAILED for ${key}: ${e}`,
      );

      if (cachedData) {
        console.log(
          `[Cache] Using STALE data for ${key} due to network error.`,
        );

        return cachedData;
      }

      throw e;
    }
  }

  // =========================
  // 设置
  // =========================

  settings = {
    domainSelector: {
      title: "选择域名",
      type: "callback",
      buttonText: "点击更新并选择",

      callback: async () => {
        const loadingId = UI.showLoading();

        let domains = [...this.#defaultDomains];

        try {
          const res = await Network.get(
            "shturl.cc/ZTn7IiZCEC1",
            {
              "User-Agent": this.ua,
            },
          );

          if (res.status === 200) {
            const match = res.body.match(
              /atob\('([A-Za-z0-9+/=]+)'\)/,
            );

            if (match && match[1]) {
              const base64 = match[1];

              const decodedString =
                Convert.decodeUtf8(
                  Convert.decodeBase64(base64),
                );

              const json = JSON.parse(decodedString);

              domains = json.map((domain) =>
                domain.trimEnd("/"),
              );

              this.saveData(
                "domains",
                JSON.stringify(domains),
              );
            }
          }
        } catch (e) {
          console.warn(
            "Could not fetch latest domains, using defaults:",
            e,
          );

          try {
            const savedDomains =
              await this.loadData("domains");

            if (savedDomains) {
              const savedDomainList =
                JSON.parse(savedDomains);

              if (
                Array.isArray(savedDomainList) &&
                savedDomainList.length > 0
              ) {
                domains = savedDomainList;
              }
            }
          } catch (loadError) {
            console.warn(
              "Could not load saved domains:",
              loadError,
            );
          }
        } finally {
          UI.cancelLoading(loadingId);
        }

        if (domains.length === 0) {
          UI.showMessage("未找到可用域名。");
          return;
        }

        const currentDomain =
          this.loadData(this.#domain_key) ||
          this.#defaultDomains[0];

        const initialIndex =
          domains.findIndex(
            (d) => d === currentDomain,
          );

        const newDomains = [
          "https://manwa.me",
          ...domains.filter(
            (d) => d !== "https://manwa.me",
          ),
        ];

        const selectedIndex =
          await UI.showSelectDialog(
            "选择一个可用域名",
            newDomains,
            initialIndex >= 0
              ? initialIndex
              : 0,
          );

        if (selectedIndex != null) {
          const selectedDomain =
            newDomains[selectedIndex];

          this.saveData(
            this.#domain_key,
            selectedDomain,
          );

          UI.showMessage(
            `已切换域名至: ${selectedDomain}`,
          );
        }
      },
    },

    imageSource: {
      type: "select",
      title: "图片源",

      options: [
        {
          value: "",
          text: "默认",
        },
        {
          value: "?v=20220724",
          text: "图源1",
        },
        {
          value: "?v=20220725",
          text: "图源2",
        },
        {
          value: "?v=20220726",
          text: "图源3",
        },
      ],

      default: "",
    },

    ua: {
      type: "input",
      title: "User-Agent",
      default: Manwa.ua,
    },

    enableCache: {
      title: "启用缓存",
      type: "switch",
      default: true,
    },

    cacheDuration: {
      title: "缓存时间 (小时)",
      type: "input",
      default: "1",
    },

    clearCache: {
      title: "清除缓存",
      type: "callback",
      buttonText: "清除",

      callback: () => {
        this.deleteData("cache_timestamps");
        this.deleteData("cache_data");
        this.deleteData("cache_keys");

        UI.showMessage("已清除缓存");
      },
    },
  };

  // =========================
  // 通用漫画解析
  // =========================

  parseComic(element) {
    const linkElement = element;

    const title =
      element.attributes["title"] ||
      linkElement.querySelector("img")?.attributes[
        "alt"
      ] ||
      linkElement
        .querySelector(
          "p.manga-list-2-title",
        )
        ?.text ||
      linkElement
        .querySelector(
          "p.book-list-info-title",
        )
        ?.text ||
      "";

    const url =
      linkElement.attributes["href"] || "";

    const id =
      url.split("/").filter(Boolean).pop() || "";

    const cover =
      linkElement.querySelector("img")
        ?.attributes["data-original"] ||
      linkElement.querySelector("img")
        ?.attributes["src"] ||
      "";

    const subTitle =
      linkElement
        .querySelector(
          "p.manga-list-2-title",
        )
        ?.text ||
      linkElement
        .querySelector(
          "p.book-list-info-title",
        )
        ?.text ||
      "";

    return new Comic({
      id: id,
      title: title.trim(),
      cover: cover,
      subTitle: subTitle.trim(),
      url: url,
    });
  }

  // =========================
  // 首页专用解析
  // =========================

  parseHomeComics(document) {
    let elements =
      document.querySelectorAll(
        "ul.manga-list-2 > li",
      );

    if (
      !elements ||
      elements.length === 0
    ) {
      elements =
        document.querySelectorAll(
          "ul.manga-list > li",
        );
    }

    if (
      !elements ||
      elements.length === 0
    ) {
      elements =
        document.querySelectorAll(
          "ul.book-list > li",
        );
    }

    return Array.from(elements).map(
      (element) => {
        const titleElement =
          element.querySelector(
            "p.manga-list-2-title",
          ) ||
          element.querySelector(
            "p.book-list-info-title",
          ) ||
          element.querySelector("p");

        const title =
          titleElement?.text?.trim() || "";

        const linkElement =
          element.querySelector("a");

        const url =
          linkElement?.attributes["href"] ||
          "";

        const id =
          url
            .split("/")
            .filter(Boolean)
            .pop() || "";

        const imgElement =
          element.querySelector("img");

        const cover =
          imgElement?.attributes[
            "data-original"
          ] ||
          imgElement?.attributes["src"] ||
          "";

        const descElement =
          element.querySelector(
            "p.manga-list-2-desc",
          ) ||
          element.querySelector(
            "p.book-list-info-desc",
          );

        const description =
          descElement?.text?.trim() || "";

        const authorElement =
          element.querySelector(
            "p.manga-list-2-author > span",
          ) ||
          element.querySelector(
            "p.book-list-info-author > span",
          );

        const author =
          authorElement?.text?.trim() || "";

        const tagElements =
          element.querySelectorAll(
            "div.manga-list-2-class > a.info-tag",
          );

        const tags =
          Array.from(tagElements || []).map(
            (tag) =>
              tag.text.trim(),
          );

        return new Comic({
          id: id,
          title: title,
          subTitle: author,
          cover: cover,
          tags: tags,
          description: description,
          url: url,
        });
      },
    );
  }

  // =========================
  // 搜索
  // =========================

  search = {
    load: async (
      keyword,
      options,
      page,
    ) => {
      const searchUrl =
        `${this.buildUrl("/search")}` +
        `?keyword=${encodeURIComponent(keyword)}` +
        `&page=${page}`;

      const res = await Network.get(
        searchUrl,
        {
          "User-Agent": this.ua,
        },
      );

      if (res.status !== 200) {
        throw new Error(
          `Failed to load search results: ${res.status}`,
        );
      }

      const document =
        new HtmlDocument(res.body);

      const lis =
        document.querySelectorAll(
          "ul.book-list > li",
        );

      const comics = lis.map((li) => {
        const titleElement =
          li.querySelector(
            "p.book-list-info-title",
          );

        const linkElement =
          li.querySelector("a");

        const imgElement =
          li.querySelector("img");

        const title =
          titleElement?.text || "";

        const url =
          linkElement?.attributes[
            "href"
          ] || "";

        const id =
          url.split("/").pop() || "";

        const cover =
          imgElement?.attributes[
            "data-original"
          ] ||
          imgElement?.attributes[
            "src"
          ] || "";

        return new Comic({
          id: id,
          title: title,
          cover: cover,
          url: url,
        });
      });

      const paginationElements =
        document.querySelectorAll(
          "ul.pagination2 > li",
        );

      const lastPaginationElement =
        paginationElements[
          paginationElements.length - 1
        ];

      const hasNextPage =
        lastPaginationElement?.text ===
        "下一页";

      const maxPage =
        hasNextPage
          ? page + 1
          : page;

      return {
        comics: comics,
        maxPage: maxPage,
      };
    },

    loadNext: async (
      keyword,
      options,
      next,
    ) => {},

    enableTagsSuggestions: false,
  };

  // =========================
  // 首页
  // =========================

  explore = [
    {
      title: "漫蛙",
      type: "multiPartPage",

      load: async () => {
        const loadHome = async (
          path,
          cacheKey,
        ) => {
          return await this._withCache(
            `home.${cacheKey}`,
            async () => {
              const res =
                await Network.get(
                  this.buildUrl(path),
                  {
                    "User-Agent":
                      this.ua,
                  },
                );

              if (res.status !== 200) {
                throw new Error(
                  `Failed to load homepage: ${res.status}`,
                );
              }

              const document =
                new HtmlDocument(
                  res.body,
                );

              return this.parseHomeComics(
                document,
              );
            },
          );
        };

        // =====================
        // 1. 女主逆袭
        // 查看更多：改为search
        // =====================

        const female =
          await loadHome(
            "booklist?page=0&tag=" +
              encodeURIComponent(
                "大女主",
              ),
            "female",
          );

        // =====================
        // 2. 悬疑系列
        // 查看更多：改为search
        // =====================

        const mystery =
          await loadHome(
            "booklist?page=0&tag=" +
              encodeURIComponent(
                "悬疑",
              ),
            "mystery",
          );

        // =====================
        // 3. 完结优选
        // 查看更多：改为search
        // =====================

        const completed =
          await loadHome(
            "booklist?page=0&end=1",
            "completed",
          );

        return [
          {
            title: "女主逆袭",
            comics: female,
            viewMore: {
              action: "search",
              keyword: "大女主",
            },
          },

          {
            title: "悬疑系列",
            comics: mystery,
            viewMore: {
              action: "search",
              keyword: "悬疑",
            },
          },

          {
            title: "完结优选",
            comics: completed,
            viewMore: {
              action: "search",
              keyword: "完结",
            },
          },
        ];
      },
    },
  ];

  // =========================
  // 漫画详情
  // =========================

  comic = {
    loadInfo: async (id) => {
      const cacheKey =
        `comic.${id}.info`;

      return this._withCache(
        cacheKey,
        async () => {
          const res =
            await Network.get(
              this.buildUrl(
                `book/${id}`,
              ),
              {
                "User-Agent":
                  this.ua,
              },
            );

          if (res.status !== 200) {
            throw new Error(
              `Failed to load comic info: ${res.status}`,
            );
          }

          const document =
            new HtmlDocument(
              res.body,
            );

          const title =
            document.querySelector(
              ".detail-main-info-title",
            )?.text || "";

          const cover =
            document.querySelector(
              "div.detail-main-cover > img",
            )?.attributes[
              "data-original"
            ] || "";

          const authorValues =
            document.querySelectorAll(
              "p.detail-main-info-author > span.detail-main-info-value",
            );

          let authorTexts = [];

          if (
            authorValues.length > 1
          ) {
            const author =
              authorValues[1]
                .querySelectorAll("a");

            authorTexts =
              author.map(
                (e) =>
                  e.text.trim(),
              );
          }

          const subtitle =
            authorValues[3]
              ?.text
              ?.trim() || "";

          const statusText =
            authorValues[2]
              ?.text
              ?.trim() ||
            "未知";

          const tags =
            document
              .querySelectorAll(
                "div.detail-main-info-class > a.info-tag",
              )
              .map(
                (e) =>
                  e.text.trim(),
              );

          const description =
            document.querySelector(
              "#detail > p.detail-desc",
            )?.text || "";

          const updateElement =
            document.querySelector(
              ".detail-list-title-3",
            );

          const updateTime =
            updateElement?.text
              ?.replace(
                "更新",
                "",
              )
              ?.trim() || "";

          // =====================
          // 章节
          // =====================

          const chapterElements =
            document.querySelectorAll(
              "ul#detail-list-select > li > a",
            );

          const chapters =
            new Map();

          chapterElements.forEach(
            (
              element,
              index,
            ) => {
              const url =
                element.attributes[
                  "href"
                ] || "";

              const name =
                element.text.trim();

              const chapterId =
                url
                  .split("/")
                  .filter(Boolean)
                  .pop() ||
                `${index}`;

              chapters.set(
                chapterId,
                name,
              );
            },
          );

          return new ComicDetails({
            title: title,

            cover: cover,

            subtitle:
              `最新章节: ${subtitle}`,

            description:
              description,

            tags: {
              作者: authorTexts,
              状态: [statusText],
              标签: tags,
            },

            chapters:
              chapters,

            updateTime:
              updateTime,
          });
        },
      );
    },

    loadThumbnails: async (
      id,
      next,
    ) => {
      return {
        thumbnails: [],
        next: null,
      };
    },

    // =========================
    // 加载章节图片
    // =========================

    loadEp: async (
      comicId,
      epId,
    ) => {
      const imageSourceParam =
        this.loadSetting(
          "imageSource",
        ) || "";

      const res =
        await Network.get(
          this.buildUrl(
            `chapter/${epId}${imageSourceParam}`,
          ),
          {
            "User-Agent":
              this.ua,
          },
        );

      if (res.status !== 200) {
        throw new Error(
          `Failed to load chapter images: ${res.status}`,
        );
      }

      const document =
        new HtmlDocument(
          res.body,
        );

      const imageElements =
        document.querySelectorAll(
          "#cp_img > div.img-content > img[data-r-src]",
        );

      const images =
        imageElements.map(
          (element) =>
            element.attributes[
              "data-r-src"
            ],
        );

      return {
        images: images,
      };
    },

    // =========================
    // 图片加载
    // =========================

    onImageLoad: (
      url,
      comicId,
      epId,
    ) => {
      const isEncrypted =
        url.includes(
          "?v=20220724",
        );

      if (isEncrypted) {
        return {
          url: url,

          headers: {
            Referer:
              this.domain + "/",

            "User-Agent":
              this.ua,

            "Sec-GPC": 1,

            Pragma:
              "no-cache",
          },

          onResponse: (data) => {
            const keyStr =
              "my2ecret782ecret";

            const key =
              Convert.encodeUtf8(
                keyStr,
              );

            return Convert.decryptAesCbc(
              data,
              key,
              key,
            );
          },
        };
      }

      return {
        url: url,

        headers: {
          Referer:
            this.domain,

          "User-Agent":
            this.ua,

          Pragma:
            "no-cache",
        },
      };
    },

    // =========================
    // 标签点击
    // =========================

    onClickTag: (
      namespace,
      tag,
    ) => {
      return {
        action: "search",
        keyword: tag,
      };
    },

    enableTagsTranslate: false,
  };

  // =========================
  // 刷新域名
  // =========================

  async refreshDomainCallback() {
    const res =
      await Network.get(
        "https://fuwt.cc/mw666",
        {
          "User-Agent":
            this.ua,
        },
      );

    if (res.status !== 200) {
      throw new Error(
        "Failed to refresh domain",
      );
    }

    const match =
      res.body.match(
        /atob\('([A-Za-z0-9+/=]+)'\)/,
      );

    if (
      !match ||
      !match[1]
    ) {
      throw new Error(
        "No domain list found in response",
      );
    }

    const base64 =
      match[1];

    const decodedString =
      Convert.decodeUtf8(
        Convert.decodeBase64(
          base64,
        ),
      );

    const json =
      JSON.parse(
        decodedString,
      );

    const domains =
      json.map(
        (domain) =>
          domain.trimEnd("/"),
      );

    this.saveData(
      "domains",
      JSON.stringify(
        domains,
      ),
    );

    UI.showMessage(
      "域名列表已刷新",
    );
  }

  // =========================
  // 初始化
  // =========================

  async init() {
    try {
      const savedDomains =
        await this.loadData(
          "domains",
        );

      if (savedDomains) {
        const domains =
          JSON.parse(
            savedDomains,
          );

        if (
          Array.isArray(domains) &&
          domains.length > 0
        ) {
          this.#defaultDomains.length = 0;

          domains.forEach(
            (domain) =>
              this.#defaultDomains.push(
                domain,
              ),
          );
        }
      }
    } catch (e) {
      console.warn(
        "Could not load saved domains, using defaults:",
        e,
      );
    }
  }

// =========================
  // 分类
  // =========================

  category = {
    title: "漫蛙分类",

    parts: [
      {
        name: "标签",

        type: "fixed",

        categories: [
          "全部", "中文", "巨乳", "中出", "口交", "19R", "透视", "全彩",
          "日漫", "群交", "校服", "日文", "女性向", "乳交", "韩漫", "肛交",
          "熟女", "马尾", "强暴", "3D", "调教", "C100", "泳装", "校园",
          "萝莉", "乱伦", "C101", "完整版", "黑肉", "纯爱", "人妻", "束缚",
          "项圈", "NTR", "眼镜", "出轨", "职场", "催眠", "露出", "手套",
          "年下", "怀孕", "处女", "乳汁", "扶他", "恋爱", "内衣", "手淫",
          "百合", "巨尻", "多毛", "会员专区", "年龄差", "野炮", "都市", "触手",
          "女仆", "遮眼", "腹黑攻", "后宫", "青梅竹马", "魔法/奇幻", "贫乳", "穿刺",
          "辣妹", "滑稽搞笑", "三角关系", "拍摄", "傲娇受", "出汗", "高颜值", "超乳",
          "足交", "妖精", "执著攻", "热血", "办公室恋情", "CG", "非H", "同居",
          "自慰", "OL", "穿越", "兽耳", "忠犬攻", "原神", "援交", "甜文",
          "剧情", "ABO", "15R", "抖S", "古风", "重逢", "搞笑", "和服",
          "师生", "少女", "性感", "放尿", "教师", "药物", "丰满", "猎奇",
          "玄幻", "剧情向", "无码", "3P/多P", "偶像", "日常", "女装", "猫女",
          "短裤", "单恋", "黑道", "本子", "旧情复燃", "堕落", "诱受‧袭受", "溺爱",
          "奇幻", "睡奸", "美人受", "人外", "色气受", "冒险", "同人", "童贞",
          "反差", "掰弯", "颜射", "潮吹", "体型差", "手交", "C99", "过膝袜",
          "虐心", "兽人", "乳贴", "出产", "虐杀", "拘束", "玩具", "上司·部下",
          "勾引", "小说改编", "制服", "修女", "SM/BDSM", "国漫", "狐娘", "吸奶",
          "重生", "一见钟情", "完结", "宅系", "爱情", "治愈", "台版", "兽娘",
          "幻想", "美人攻", "巨屌", "强攻", "壮受", "奴隶", "可爱受", "大女主",
          "大叔", "凌辱", "其他", "转化", "诱受·袭受", "魔幻", "兽交", "排泄",
          "重口", "巨根", "虐待", "非现代", "母子", "大尺度", "豪门", "连载中",
          "戏剧", "巫女", "黑皮", "前辈·后辈", "醉酒", "初体验", "性转", "禁断·背德",
          "筋肉", "短篇合集", "动作", "护士", "生活", "主仆关系", "初恋", "画册",
          "惊悚/悬疑", "一夜情", "眼罩", "肌肉", "围裙", "娱乐圈", "无口", "抹油",
          "年下男子", "伪娘", "同级生", "温柔攻", "花嫁", "附身", "固执受", "强受",
          "母亲", "复仇", "皮物", "魅魔", "旗袍", "夹腿", "鬼族", "男公关",
          "窒息", "邻居", "逆袭", "总裁", "痴汉", "悬疑", "异世界", "淫纹",
          "硬派攻", "肉食系", "监禁", "正妹", "轻熟女", "科幻", "酷刑", "变态",
          "双马尾", "连载", "傲娇", "人妖", "深情攻", "阿黑颜", "职业女性", "病娇",
          "医生", "忠犬受", "吸血鬼", "男孕", "无修正", "张口", "少男", "浪漫",
          "C97", "上班族", "灌肠", "多CP", "动图", "宫廷", "COSPLAY", "青春",
          "放屁", "正太", "女王受", "契约关系", "内射", "排尿", "饮精", "警察",
          "美漫", "寡妇", "唯美", "短篇集", "台漫", "战斗", "王族·贵族", "伦理",
          "疯批攻", "股交", "王子", "青年漫", "傲娇攻", "灵异", "抖M",
          "恶魔", "暴力", "傲慢攻", "壁尻", "单行本", "女警", "双向暗恋", "病娇攻",
          "丸吞", "恐怖", "系统", "女巫", "犬娘", "新娘", "幽灵", "强奸",
          "女性支配", "骨科/伪骨科", "肉欲", "武侠", "重口味", "淫荡", "异种族", "产卵",
          "见本", "妈妈", "天然受", "雀斑", "淫乱", "腹黑", "连裤袜", "换身",
          "浴衣", "相亲·联谊", "寄生", "改编", "C96", "少年", "爆笑", "拳交",
          "欲望", "侄女", "强制", "御姐", "天然系", "忠犬", "失忆", "痴女",
          "异能", "健气受", "淫荡受", "FF39", "NP", "天使", "办公室", "微码",
          "C95", "寡默攻", "野外", "瘙痒", "YAOI", "纯情少女", "恋爱生活", "条漫",
          "和风", "霸总", "格斗", "耽美", "喝尿", "双子", "修真", "架空",
          "后悔攻", "年上男子", "性玩具", "C94", "鼻钩", "生子", "呆萌受", "怪物女孩",
          "微虐", "菁英", "萌系", "轮奸", "育儿", "长条", "心机攻", "女学生",
          "大小姐", "执事", "黑白", "火影", "恋尸", "绿帽", "富二代", "热血机战",
          "魔法奇幻", "美食", "直男受", "逆后宫", "丝袜", "霸道攻", "有夫之妇", "真人",
          "偷情", "推理", "纯情受", "电击", "扶她", "科幻未来", "女大学生", "舔阴",
          "追妻火葬场", "知音漫客", "昆虫", "冰释前嫌", "漫画家·作家", "C92", "哭包攻", "推理悬疑",
          "小说", "禁漫汉化组", "诱惑", "召唤", "励志", "架空历史", "纯情攻", "超能力",
          "连续高潮", "财阀", "兄妹", "异国之恋", "橘味", "跟踪狂", "不伦", "长篇",
          "丧尸", "SM", "多攻", "体育竞技", "情趣用品", "军服", "舔足", "纯真受",
          "天然攻", "互攻", "兔女郎", "王公贵族", "创伤受", "家教", "毛绒绒", "鬼怪",
          "接吻", "性爱", "恐怖惊悚", "假期性爱系列", "暗恋", "怯懦攻", "PIXIV", "脑洞",
          "JK", "绝伦攻", "办公女郎", "古装", "粪便", "媚药", "狼女", "洗脑",
          "FOCUS", "血腥", "枷刑", "契约", "新作", "执着攻", "捆绑", "石化",
          "大乳晕", "马娘", "C93", "偏执攻", "虐文", "动画化", "C86", "耽美人生",
          "鞭打", "黑人", "魔法", "高甜", "强迫", "C90", "装逼", "渣攻",
          "C91", "敌对关系", "转生", "春药", "吊带袜", "伤疤", "鬼畜", "不良",
          "平凡受", "不良少年", "女高中生", "踩踏", "轻浮受", "浪漫爱情", "C88", "游戏",
          "战争", "炮友", "婊子受", "妄想系", "性勒索", "道具", "淫乱受", "扩张",
          "可爱攻", "不伦/劈腿", "女扮男装", "3P", "特殊职业", "精灵", "运动", "彩虹",
          "好友", "日生佑稀", "高潮", "女大生", "长腿", "姐妹", "模特儿", "狂攻系列",
          "恶役千金", "成人", "直男攻", "禁断", "AV男优", "修仙", "S", "软萌受",
          "占有欲", "女神", "本崎月子", "极力推荐", "风俗", "神鬼", "上司", "兄弟情",
          "虫洞", "强制爱", "老师", "假小子", "按摩", "姐弟", "面瘫攻", "FF40",
          "妹妹", "外国人", "连体衣", "宫斗", "自卑受", "硬派受", "惊奇", "淫魔",
          "竞技", "C89", "腹黑受", "黑丝", "源一実", "近亲", "异种奸", "蛇女",
          "漫客栈", "女恶魔", "兄弟丼", "背叛", "上流社会", "非人", "鬼畜攻", "C87",
          "母狗", "性欲", "紧缚", "教授", "兄弟", "双胞胎", "英文", "养成",
          "年上", "木马", "秘书", "淫魔·魅魔", "绷带", "姫屋", "RYONA", "历史",
          "通奸", "发交", "漫画", "婊子", "帅气女", "魔法少女", "哭包受", "团藤さや",
          "堕胎", "疗愈", "律师", "姐姐", "单纯受", "鲨鱼", "性奴", "年下攻",
          "山本ともみつ", "口交脸", "圈养", "格差", "下克上", "山口ねね", "C78", "报仇",
          "父女",
        ].map((label) => ({
          label,
          target: {
            page: "category",
            attributes: {
              category: "tag",
              param:
                label === "全部"
                  ? ""
                  : label,
            },
          },
        })),
      },
    ],

    // 删除排行榜入口
    enableRankingPage: false,
  };

  // =========================
  // 分类漫画
  // =========================

  categoryComics = {
    load: async (
      category,
      param,
      options,
      page,
    ) => {
      // 修复：使用buildUrl自动处理斜杠，解决域名粘连问题
      let url = this.buildUrl(`booklist?page=${page}`);

      let status;
      let gender;
      let area;
      let sort = null;
      // ==========【修复重点】tag页面也读取全部筛选选项 ==========
      // options顺序：[状态,类型,地区,排序]
      [status, gender, area, sort] = options;

      if (category === "tag") {
        if (param !== "") {
          url += `&tag=${encodeURIComponent(param)}`;
        }
      } else if (category === "end") {
        [gender, area, sort] = options;
        status = param;
      } else if (category === "gender") {
        [status, area, sort] = options;
        gender = param;
      } else if (category === "area") {
        [status, gender, sort] = options;
        area = param;
      }

      if (status) {
        url += `&end=${status}`;
      }
      if (gender) {
        url += `&gender=${gender}`;
      }
      if (area) {
        url += `&area=${area}`;
      }
      if (sort) {
        url += `&sort=${sort}`;
      }

      // 替换replaceAll为正则，兼容旧版Venera引擎
      url = url.replace(/_1/g, "-1");

      const res =
        await Network.get(
          url,
          {
            "User-Agent":
              this.ua,
          },
        );

      if (res.status !== 200) {
        throw new Error(
          `Failed to load category comics: ${res.status}`,
        );
      }

      const html =
        new HtmlDocument(
          res.body,
        );

      const parseComic =
        (element) => {
          const titleElement =
            element.querySelector(
              "p.manga-list-2-title",
            ) ||
            element.querySelector(
              "p.book-list-info-title",
            );

          const title =
            titleElement?.text
              ?.trim() || "";

          const linkElement =
            element.querySelector(
              "a",
            );

          const url =
            linkElement?.attributes[
              "href"
            ] || "";

          const id =
            url
              .split("/")
              .filter(Boolean)
              .pop() || "";

          const coverElement =
            element.querySelector(
              "img",
            );

          const cover =
            coverElement?.attributes[
              "data-original"
            ] ||
            coverElement?.attributes["src"] ||
            "";

          const tagElements =
            element.querySelectorAll(
              "div.manga-list-2-class > a.info-tag",
            );

          const tags =
            Array.from(
              tagElements || [],
            ).map(
              (tag) =>
                tag.text.trim(),
            );

          const descElement =
            element.querySelector(
              "p.manga-list-2-desc",
            ) ||
            element.querySelector(
              "p.book-list-info-desc",
            );

          const description =
            descElement?.text
              ?.trim() || "";

          const authorElement =
            element.querySelector(
              "p.manga-list-2-author > span",
            ) ||
            element.querySelector(
              "p.book-list-info-author > span",
            );

          const author =
            authorElement?.text
              ?.trim() || "";

          return new Comic({
            id: id,
            title: title,
            subTitle: author,
            cover: cover,
            tags: tags,
            description:
              description,
            url: url,
          });
        };

      let comicElements =
        html.querySelectorAll(
          "ul.manga-list-2 > li",
        );

      if (
        comicElements.length === 0
      ) {
        comicElements =
          html.querySelectorAll(
            "ul.book-list > li",
          );
      }

      const comics =
        Array.from(
          comicElements,
        ).map(
          parseComic,
        );

      // =====================
      // 分页
      // =====================

      const paginationElements =
        html.querySelectorAll(
          "ul.pagination2 > li",
        );

      const next =
        paginationElements.length >
        0
          ? paginationElements[
              paginationElements.length -
                1
            ].text
              .trim() ===
            "下一页"
          : false;

      const maxPage =
        next
          ? page + 1
          : page;

      return {
        comics:
          comics,
        maxPage:
          maxPage,
      };
    },

    optionList: [
      {
        label: "状态",

        options: [
          "-全部",
          "2-连载中",
          "1-完结",
        ],
      },

      {
        label: "类型",

        options: [
          "_1-全部",
          "2-一般向",
          "0-BL向",
          "1-禁漫",
          "3-TL向",
        ],

        notShowWhen: [
          "gender",
        ],
      },

      {
        label: "地区",

        options: [
          "-全部",
          "2-韩国",
          "3-日漫",
          "4-国漫",
          "5-台漫",
          "6-其他",
          "1-未分类",
        ],

        notShowWhen: [
          "area",
        ],
      },

      {
        label: "排序",

        options: [
          "_1-最新",
          "0-最旧",
          "1-收藏",
          "2-新漫",
        ],
      },
    ],

    // =========================
    // 排行榜
    // =========================

    ranking: {
      options: [
        "day-日榜",
        "week-周榜",
        "month-月榜",
      ],

      load: async (
        option,
        page,
      ) => {
        const url =
          this.buildUrl("rank");

        const res =
          await Network.get(
            url,
            {
              "User-Agent":
                this.ua,
            },
          );

        if (res.status !== 200) {
          throw new Error(
            `Failed to load ranking comics: ${res.status}`,
          );
        }

        const html =
          new HtmlDocument(
            res.body,
          );

        function parseComic(
          element,
        ) {
          const title =
            element.attributes[
              "title"
            ] || "";

          const id =
            element.attributes[
              "href"
            ] ||
            element.href ||
            "";

          const coverElement =
            element.querySelector(
              "img",
            );

          const cover =
            coverElement?.attributes[
              "data-original"
            ] || "";

          const parent =
            element.parent?.parent;

          const description =
            parent
              ?.querySelector(
                ".manga-list-2-tip",
              )
              ?.text
              ?.trim() || "";

          return new Comic({
            id: id,
            title: title,
            subTitle:
              description,
            description:
              description,
            cover: cover,
          });
        }

        const comicElements =
          html.querySelectorAll(
            "#rankList_2 > a",
          );

        const comics =
          Array.from(
            comicElements,
          ).map(
            parseComic,
          );

        return {
          comics:
            comics,

          maxPage: 1,
        };
      },
    },
  };
}
