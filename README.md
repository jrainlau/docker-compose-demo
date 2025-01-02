> 本文所涉及的代码都在 [jrainlau/todo-mvc-x-docker-compose](https://github.com/jrainlau/todo-mvc-x-docker-compose)，欢迎 star 欢迎打 call！


在当前的工作的项目中，我们大量使用了 Docker Compose 的相关技术。由于此前的工作和学习都缺乏相关的项目经验，因此 Docker 的知识一直是我的短板，基本只停留在“知道是怎么一回事，但没有深入使用过”的浅层理解。面对项目中各种繁杂的 Docker 配置，一时半会之间差点应付不过来。为了补上这块短板，我参考了项目的编排，DIY 了一个麻雀虽小却五脏俱全的 mini 项目，旨在完整地体验一次 Docker Compose 的玩法。

## 一、技术选型

如果说学习一门编程语言的第一步是“Hello World”，那么学习一套全栈开发的第一步，一定非“TodoMVC”莫属。我将构建一个前后端分离的 TodoMVC 应用，包含了呈现功能的前端页面、提供接口的后端服务、存放数据的数据库，实现完整的增删改查功能。

<img width="633" alt="Clipboard_Screenshot_1735803044" src="https://github.com/user-attachments/assets/4931db83-9c23-46d2-bdef-0ec76db11d13" />

时间来到了 2025 年，因此我将尝试结合当前比较新颖的工具，来完成项目的搭建工作。

- 前端
    采用 Vite + React + TS 来初始化和运行，使用 Bun 作为包管理工具。

- 后端
    采用 Bun + Elysia + TS 来初始化和运行。

- 数据库
    MongoDB，因为足够简单，本地搭配 MongoDB Compass 可以非常直观地查看数据库内容。

- 路由分发
    Nginx。配置简单，通过 Nginx 对路由进行分发，实现同时对前后端模块进行开发和联调的目的。

值得注意的是，我在项目里均使用了 Bun 这一工具来代替 NodeJS。它是一个集 JavaScript 运行时、打包工具、转译器于一体的工具，它具有高性能的特点，能在提升运行速度、优化打包过程等方面为 JavaScript 开发提供高效的解决方案。最重要的是它天生就直接支持 ESM 模块和允许直接运行 TS，是非常值得尝试的东西。

接下来，我们一步一步开始这个 TodoMVC 的应用搭建。

## 二、数据库通过 Docker Compose 启动
在项目开始之前，我们先要准备一个 MongoDB 数据库。传统的安装运行方式已经过时，我们将直接通过 Docker 来启动。在此之前，请确保你的电脑里已经安装了 Docker 运行时。这里推荐使用 OrbStack，因为它足够轻便、高效。由于 Docker hub 被封，没有魔法的用户可以在 OrbStack 中配置腾讯的 Docker 镜像源 https://mirror.ccs.tencentyun.com

<img width="540" alt="Clipboard_Screenshot_1735805136" src="https://github.com/user-attachments/assets/fac78ce6-75a3-408d-beec-2f42e1ad164e" />


来到项目根目录，我们首先来新建一个 `docker-compose.yml` 文件，内容如下：

```yml
services:
  my-mongo:
    image: mongo
    ports:
      - "27017:27017"
    volumes:
      - ./.mongodb:/data/db #数据持久化，避免重启容器后数据丢失
```

接下来通过终端运行 `docker-compose up`，即可自动拉取官方的 MongoDB 镜像，启动后把容器内的 27017 端口映射到本机的 27017 端口。我们可以通过 MongoDB Compass 这个工具来查看是数据库已经能够正常连接了：

<img width="1025" alt="Clipboard_Screenshot_1735805310" src="https://github.com/user-attachments/assets/f9eea6db-6768-4b7b-ac17-f2fcccfeeed6" />

当然，你也可以直接通过 Docker 指令直接把 MongoDB 跑起来

```bash
docker pull mongo

docker run --name my-mongo -p 27017:27017 mongo
```

但是作为有代码洁癖的我来说，这种写法冗长繁杂难以记忆又容易出错，确实不如把参数变成配置来得好，而这也正是 Docker Compose  的优势之一。

## 三、后端服务
对于前后端分离的全栈应用，我会优先完成提供接口的后端服务。

类似 Koa 之于 NodeJS，Elysia 是一个在 Bun 上运行，用于构建高性能、类型安全的 Web 应用程序的快速 HTTP 框架，基于 TypeScript，提供简洁的 API 和高效的中间件系统来方便开发者创建服务器应用。

在项目的根目录下，通过 Bun 来初始化一个基于 Elysia 的应用：

```bash
bun create elysia backend
```

项目初始化后，便可以在 `backend/src/index.ts` 中看到如下代码：

![carbon (2)](https://github.com/user-attachments/assets/3a77219b-0965-4ab2-b38c-05a7f2f587fa)


接下来我们将对这部分代码进行改造，完成一个最简单的后端应用。它将分成 3 个部分进行：

1. 连接 MongoDB 数据库；
2. 提供Restful 接口实现增删查功能；
3. 运行在 8080 端口

由于 Bun 能够兼容 NodeJS 的绝大部分功能，因此我们也将采用在 NodeJS 里熟悉的 mongoose 工具来操作数据库。

```
bun install mongose
```

首先来定义一个 Todo 对象的 Schema：

```ts
const Todo = mongoose.model('Todo', new mongoose.Schema({
  text: String,
  completed: Boolean,
  updateTime: Date,
}));
```

接下来连接数据库：
```ts
mongoose.connect('mongodb://my-mongo:27017/local')
```

注意，由于我们的项目将通过 Docker Compose 来运行，因此容器之间将通过“容器名称”来相互调用。在上一节中我们启动名为 `my-mongo` 的数据库，因此这里的连接 URL 也相应地写成 my-mongo。

连接了数据库以后，便可提供增删改查的接口了。最后再监听 8080 端口就大功告成。

```ts
mongoose.connect('mongodb://my-mongo:27017/local')
  .then(() => {
    console.log('Connected to MongoDB.');

    // Define the routes
    const app = new Elysia()
      .get('/api', () => 'Hello Elysia')
      .get('/api/todos', async () => {
        const todos = await Todo.find();
        return todos;
      })
      .post('/api/todos', async (req: any) => {
        const newTodo = new Todo({
          text: req.body.text,
          completed: false,
          updateTime: new Date(),
        });
        await newTodo.save();
        return newTodo.toJSON();
      })
      .patch('/api/todos', async (req: any) => {
        const { ids, completed } = req.body;
        await Todo.updateMany({ _id: { $in: ids } }, { completed });
        return { message: 'Todos updated' };
      })
      .delete('/api/todos', async (req: any) => {
        const { ids } = req.body;
        await Todo.deleteMany({ _id: { $in: ids } });
        return { message: 'Todos deleted' };
      })
      .listen(8080);

    console.log('🦊 Elysia are listening on port 8080...');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

```

业务代码写好了，接下来我们就要把这个 backend 模块打成一个镜像，然后在 Docker Compose 中启动起来。

首先写一个 Dockerfile：

```dockerfile
# 使用最新版本的 oven/bun 作为基础镜像
FROM oven/bun:latest

# 设置工作目录为 /backend
WORKDIR /backend

# 创建一个空的脚本文件 /bin/run-backend.sh
RUN touch /bin/run-backend.sh

# 赋予 /bin/run-backend.sh 可执行权限
RUN chmod +x /bin/run-backend.sh

# 将安装依赖和启动开发服务器的命令写入 /bin/run-backend.sh
RUN echo "bun install --no-save;" \
     "bun dev --host" \ >> /bin/run-backend.sh

# 暴露容器的 8080 端口
EXPOSE 8080

# 设置容器启动时执行的命令
CMD ["/bin/run-backend.sh"]
```

这里没有分别使用 RUN 去执行依赖安装和启动，而是把它们先写到一个 .sh 文件再一起跑的方式，是因为我在实践中摸到过坑。如果用类似下面的写法：
```
RUN bun install

CMD ["bun", "dev", "--host"]
```
会偶现通过 Docker Compose 启动时报错，提示权限问题或者一些依赖包找不到等问题，很奇怪。这里我没有深入研究，有相关经验的同学欢迎一起讨论。

接下来在 `docker-compose.yml` 中把它加进去：

```yml
services:
  my-mongo: ...

  my-backend:
    image: my-backend
    build:
      context: ./backend
      dockerfile: Dockerfile
      no_cache: true
    restart: always
    volumes:
      - ./backend:/backend #为了在 dev 模式下实现热更新，这里把本地目录映射到容器目录
    depends_on:
      - my-mongo #依赖数据库
```

接下来我们重新执行 `docker compose up`，便可看到后端服务已经正常启动了。

![carbon (5)](https://github.com/user-attachments/assets/3143d7e6-660e-42fa-9043-56c40df41c24)

# 四、前端服务
在项目根目录下，执行
```bash
bun create vite
```
然后按照提示命名为 frontend，并使用你喜欢的技术栈（这里使用 React）。前端项目代码很简单，就不赘述了，这里只讲述关键的一些地方。

首先基于 vite 的项目都能支持代码热更新，它有一个默认端口，出于习惯我在 `frontend/vite.config.ts` 里把它改成了 3000。

```
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

然后它的 Dockerfile 如下：
```
FROM oven/bun

WORKDIR /frontend

RUN touch /bin/run-frontend.sh
RUN chmod +x /bin/run-frontend.sh

# vite 必须要添加 --host 参数才能在容器外访问到 localhost
RUN echo "bun install --no-save;" \
         "bun dev --host" \ >> /bin/run-frontend.sh

EXPOSE 3000

CMD ["/bin/run-frontend.sh"]
```

和 backend 类似，这里也使用了把启动命令写到一个 .sh 文件后再启动的方式。

最后在 `docker-compose.yml` 中把它加进去：

```yml
services:
  my-mongo: ...

  my-backend: ...

  my-frontend:
    image: my-frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile
      no_cache: true

    # 这里把 frontend 目录做了个映射，以及暴露 3000 端口，都是为了在 vite 开发时实现代码热更新。
    volumes:
      - ./frontend:/frontend
    ports:
      - "3000:3000"

```

通过 `docker compose up` 启动后，查看 my-frontend 容器的 log，看到这样的输出就证明成功了：

![carbon (6)](https://github.com/user-attachments/assets/320823c4-bddb-40ba-a8b1-3c6bdff4431f)

# 五、Nginx 路由分发
现在前端服务在 3000 端口，而后端服务在 8080 端口，会引起跨域问题。这时候就轮到 Nginx 出场了。

回到项目根目录，新建一个 nginx 目录，然后往里面添加 `nginx.conf` 文件：

```
server {
  listen 80;

  location / {
    proxy_pass http://my-frontend:3000;
  }

  location /api {
    proxy_pass http://my-backend:8080;
  }
}
```

由于是在 Docker Compose 中启动，因此这里直接填写容器的名称。接下来给这个 Nginx 新建一个 Dockerfile：

```
FROM nginx:latest

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

这里有个细节，就是本地的配置文件名叫 `nginx.conf`，但是复制到容器后要命名为 `default.conf`，不然会不生效（可能和我拉取的 nginx 镜像版本有关，大家可以自己实操一下试试）。

同样的，回到 `docker-compose.yml` 中把 Nginx 加进去：

```yml
services:
  my-mongo: ...

  my-backend: ...

  my-frontend: ...

  my-nginx:
    image: my-nginx
    build:
      context: ./nginx
      dockerfile: Dockerfile
      no_cache: true
    depends_on:
      - my-mongo
      - my-backend
      - my-frontend
    ports:
      - "80:80"
```

到这一步为止，所有的容器已经准备好了。回到 OrbStack，**手动**停掉和删除之前的所有容器和镜像，再手动在项目根目录下执行一次 `docker compose up`，相信你会看正在顺利运行的四个容器：

<img width="637" alt="Clipboard_Screenshot_1735814573" src="https://github.com/user-attachments/assets/87060705-cca6-4f38-98d6-51945d7f63e6" />


在浏览器上访问 localhost，相信你也会看到想要的效果：

<img width="633" alt="Clipboard_Screenshot_1735815537" src="https://github.com/user-attachments/assets/b2e16dc9-66ca-4628-92aa-64f11b8d709a" />


# 六、启动脚本优化
在上一步的最后，我们是手动停掉和删除之前的所有容器和镜像再启动的，这有点不优雅。如果希望在每次重新启动这套应用之前，都能清理掉上一次的东西就好了。为了实现这个目的，我们可以在项目根目录下新建一个 `dev.sh`：

```bash
#!/bin/bash

# 停止并移除所有与 docker-compose 配置相关的容器、网络、卷和镜像
# --rmi local: 移除本地构建的镜像
# --volumes: 移除与容器相关的卷
# --remove-orphans: 移除未在 docker-compose 文件中定义的容器
docker-compose down --rmi local --volumes --remove-orphans

# 根据 docker-compose 文件启动容器
docker-compose up

# 强制删除所有停止的容器
docker container prune -f

```

最后给这个 `dev.sh` 添加可执行权限：

```
chmod +x ./dev.sh
```

根目录下执行 `./dev.sh`，即可完成该 TodoMVC 项目的一键启动。

# 七、尾声
以上的步骤都是基于“开发模式”而来的，由于 Bun 优异的特性，无论是依赖安装还是应用启动都非常丝滑，并且能够享受到代码热更新带来的便捷。如果需要运行“生产模式”，前后端服务都需要修改其 Dockerfile 的内容，Nginx 的配置也要做相应的修改，这些内容就作为思考题留给各位读者啦！

（完）
