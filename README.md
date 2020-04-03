# simple-proxy

Just a simple server to proxy request.

## 项目部署

***建议使用`pm2`进行项目的启动与维护。***

1、全局安装pm2依赖

```bash
npm i -g pm2
```

2、启动项目

在项目根目录下执行：

```bash
# 初次启动
npm run start

# 重启
npm run restart
```

3、开启自启动

执行下述命令，pm2会给出一串脚本命令，在终端中复制粘贴该命令并回车执行即可。

```bash
npm run getShellUsedToStartProjectAfterReboot
```

4、查看项目日志

```bash
npm run log
```

5、停止和删除项目

停止项目：

```bash
npm run stop
```

从PM2项目清单中删除项目：

```bash
npm run delete
```

## License

MIT协议。免费开源，可以随意使用，但因使用而产生的问题请自行负责。
