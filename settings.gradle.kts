pluginManagement {
    repositories {
        // 1. 优先使用阿里云的 Google 镜像来加速插件下载
        maven { url = uri("https://maven.aliyun.com/repository/google") }

        // 2. 官方仓库作为备用（获取官方插件等）
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        // 1. 优先使用阿里云的 Google 镜像来下载 androidx.* 库
        maven { url = uri("https://maven.aliyun.com/repository/google") }

        // 2. 官方仓库作为备用
        google()
        mavenCentral()

        // 如果您使用了像 jitpack 上的库，可以添加：
        // maven { url = uri("https://jitpack.io") }
    }
}

rootProject.name = "AICollector"
include(":app")