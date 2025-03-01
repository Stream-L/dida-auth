# Dida OAuth Client

该项目是一个用于连接 Dida365 API 的 OAuth 2.0 客户端。用户可以通过此客户端获取访问令牌，以便与 Dida365 API 进行交互。

## 操作流程

### 1. 设置 Redirect URI

在 Dida365 开发者管理页面（https://developer.dida365.com/manage）中设置 Redirect URI。建议使用以下格式：

```
https://yourdomain.com/callback
```

在客户端页面中，Redirect URI 会自动生成并显示。用户可以点击复制按钮将其复制，然后粘贴到滴答开发者管理页面的 Redirect URI 设置中并保存。

### 2. 获取 Client ID 和 Client Secret

在 Dida365 开发者管理页面中创建一个新的应用程序，并获取 `Client ID` 和 `Client Secret`。

### 3. 配置客户端

在客户端页面中，输入以下信息：

- **Client ID**: 从 Dida365 开发者管理页面获取的 `Client ID`。
- **Client Secret**: 从 Dida365 开发者管理页面获取的 `Client Secret`。

### 4. 获取授权码

点击 "Get Authorization Code" 按钮，客户端会跳转到 Dida365 的授权页面。用户需要在该页面中允许授权，然后会重定向回设置的 Redirect URI，并附带授权码。

### 5. 获取访问令牌

在客户端页面中，点击 "Get Access Token" 按钮，客户端会使用授权码请求访问令牌。成功后，页面会显示访问令牌和完整的响应信息。

## 注意事项

- 确保在浏览器中允许弹出窗口，以便客户端能够打开 Dida365 的授权页面。
- 确保在 Dida365 开发者管理页面中正确设置 Redirect URI。

## 示例

以下是一个示例配置：

- **Redirect URI**: `https://yourdomain.com/callback`
- **Client ID**: `your_client_id`
- **Client Secret**: `your_client_secret`

在客户端页面中输入上述信息后，按照操作流程获取授权码和访问令牌。

````

````
