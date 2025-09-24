# Tài liệu mô tả các hàm Blockchain Service

## 📋 Mục lục

- [Các hàm Helper](#các-hàm-helper)
- [Quản lý công ty](#quản-lý-công-ty)
- [Quản lý nông trại](#quản-lý-nông-trại)
- [Quản lý sản phẩm](#quản-lý-sản-phẩm)
- [Truy vấn thông tin](#truy-vấn-thông-tin)

## Highlights chính:

- 🔧 Helper Functions: Các hàm tiện ích để tạo contract instances và xử lý dữ liệu
- 🏢 Company Management: Đăng ký và quản lý thông tin công ty trên blockchain
- 🌾 Farm Management: Tạo chuỗi cung ứng cho nông trại
- 📦 Product Management: Thêm sản phẩm, cập nhật quy trình và trạng thái

---

## 🔧 Các hàm Helper

### `getFarmContract(signer: ContractRunner | null): Contract`

**Mục đích:** Tạo instance contract chính (Farm Traceability) để tương tác với smart contract quản lý nông trại trên blockchain.

**Tham số:**

- `signer`: Đối tượng signer hoặc provider để ký và gửi transaction

**Trả về:** Instance của Contract để gọi các function trên smart contract

**Sử dụng:** Được dùng nội bộ bởi các hàm khác để tạo kết nối đến contract chính.

---

### `getSupplyChainContract(contractAddress: string, signer: ContractRunner | null): Contract`

**Mục đích:** Tạo instance contract chuỗi cung ứng (Supply Chain) cho một nông trại cụ thể.

**Tham số:**

- `contractAddress`: Địa chỉ contract chuỗi cung ứng trên blockchain
- `signer`: Đối tượng signer hoặc provider để ký transaction

**Trả về:** Instance của Contract chuỗi cung ứng

**Xử lý lỗi:** Ném lỗi nếu địa chỉ contract không hợp lệ

---

### `getProviderAndSigner(walletProvider: Eip1193Provider)`

**Mục đích:** Khởi tạo provider và signer từ ví cryptocurrency (MetaMask, WalletConnect, etc.)

**Tham số:**

- `walletProvider`: Provider từ ví kết nối (tuân thủ chuẩn EIP-1193)

**Trả về:** Object chứa `{provider, signer}` để tương tác với blockchain

**Xử lý lỗi:**

- Lỗi nếu không tìm thấy ví
- Lỗi nếu không thể tạo signer

---

### `toJSONString(data: any): string`

**Mục đích:** Chuyển đổi dữ liệu thành chuỗi JSON để lưu trữ trên blockchain.

**Tham số:**

- `data`: Dữ liệu cần chuyển đổi (object, array, hoặc string)

**Trả về:** Chuỗi JSON

**Logic:** Nếu data đã là string thì trả về nguyên bản, ngược lại sử dụng `JSON.stringify()`

---

## 🏢 Quản lý công ty

### `getCompanyInfo(walletProvider: Eip1193Provider, businessID: string)`

**Mục đích:** Lấy thông tin công ty đã đăng ký trên blockchain theo mã số doanh nghiệp.

**Tham số:**

- `walletProvider`: Provider từ ví
- `businessID`: Mã số doanh nghiệp (có thể là mã số thuế)

**Trả về:** Thông tin công ty từ smart contract

**Đặc điểm:**

- Chỉ đọc dữ liệu (không tốn gas)
- Có `queryKey` để cache kết quả với React Query

**Sử dụng:** Kiểm tra thông tin công ty trước khi thực hiện các thao tác khác

---

### `registerCompany(params)`

**Mục đích:** Đăng ký công ty mới lên blockchain với thông tin cơ bản.

**Tham số:**

- `businessID`: Mã số doanh nghiệp
- `name`: Tên công ty
- `wallet`: Địa chỉ ví của công ty
- `walletProvider`: Provider từ ví

**Trả về:** Hash của transaction sau khi đăng ký thành công

**Đặc điểm:**

- Tốn gas để thực hiện transaction
- Chờ confirmation trước khi trả về kết quả
- Lưu thông tin công ty vĩnh viễn trên blockchain

---

## 🌾 Quản lý nông trại

### `createFarmSupplyChain(params)`

**Mục đích:** Tạo một contract chuỗi cung ứng mới cho nông trại cụ thể.

**Tham số:**

- `businessID`: Mã số doanh nghiệp sở hữu nông trại
- `farmName`: Tên nông trại
- `farmData`: Dữ liệu chi tiết về nông trại (JSON string)
- `walletProvider`: Provider từ ví

**Trả về:** Hash của transaction tạo contract

**Đặc điểm:**

- Tạo ra một smart contract mới cho nông trại
- Contract mới có địa chỉ riêng để quản lý sản phẩm
- Cần sử dụng `getContractAgriAddress()` để lấy địa chỉ contract sau khi tạo

---

## 📦 Quản lý sản phẩm

### `getContractAgriAddress(hash: string)`

**Mục đích:** Lấy địa chỉ contract chuỗi cung ứng vừa được tạo từ transaction hash.

**Tham số:**

- `hash`: Transaction hash từ hàm `createFarmSupplyChain`

**Trả về:** Object chứa:

- `contractAddress`: Địa chỉ contract mới tạo
- `contractName`: Tên contract
- `isContract`: Có phải là contract không
- `isVerified`: Contract đã được verify chưa
- `data`: Dữ liệu gốc từ API

**Đặc điểm:**

- Gọi API external (zeroscan.org) để lấy thông tin
- Cần thiết để có địa chỉ contract trước khi thêm sản phẩm
- Có `queryKey` để cache với React Query

---

### `addProductToSupplyChain(params)`

**Mục đích:** Thêm sản phẩm nông nghiệp mới vào chuỗi cung ứng của nông trại.

**Tham số:**

- `productId`: Mã sản phẩm duy nhất
- `productName`: Tên sản phẩm
- `productData`: Dữ liệu chi tiết sản phẩm (JSON string)
- `walletProvider`: Provider từ ví
- `contractAgri`: Địa chỉ contract chuỗi cung ứng

**Trả về:** Hash của transaction thêm sản phẩm

**Đặc điểm:**

- Kiểm tra sản phẩm đã tồn tại chưa trước khi thêm
- Tốn gas để thực hiện transaction
- Tạo record sản phẩm trên blockchain

---

### `updateProductProcesses(params)`

**Mục đích:** Cập nhật quy trình sản xuất/chăm sóc cho một batch sản phẩm cụ thể.

**Tham số:**

- `productId`: Mã sản phẩm
- `batch`: Mã lô/batch sản phẩm
- `newProcesses`: Dữ liệu quy trình mới (JSON string)
- `walletProvider`: Provider từ ví
- `contractAgri`: Địa chỉ contract chuỗi cung ứng

**Trả về:** Hash của transaction cập nhật

**Sử dụng:** Ghi lại các hoạt động chăm sóc, xử lý sản phẩm theo từng lô

---

### `updateProductStatus(params)`

**Mục đích:** Cập nhật trạng thái hiện tại của một batch sản phẩm.

**Tham số:**

- `productId`: Mã sản phẩm
- `batch`: Mã lô sản phẩm
- `status`: Trạng thái mới (ví dụ: "Đang trồng", "Thu hoạch", "Đang vận chuyển")
- `walletProvider`: Provider từ ví
- `contractAgri`: Địa chỉ contract chuỗi cung ứng

**Trả về:** Hash của transaction cập nhật

**Sử dụng:** Theo dõi vòng đời sản phẩm từ sản xuất đến tiêu thụ

---

## 🔍 Truy vấn thông tin

### `getProductByBatch(params)`

**Mục đích:** Lấy thông tin chi tiết của một batch sản phẩm từ blockchain.

**Tham số:**

- `walletProvider`: Provider từ ví
- `productId`: Mã sản phẩm cần truy vấn
- `batch`: Mã batch cần truy vấn
- `contractAgri`: Địa chỉ contract chuỗi cung ứng

**Trả về:** Object `ProductInfo` chứa:

- `id`: Mã sản phẩm
- `productName`: Tên sản phẩm
- `productData`: Dữ liệu sản phẩm (đã parse từ JSON)
- `status`: Trạng thái hiện tại
- `careActivityData`: Dữ liệu hoạt động chăm sóc (đã parse từ JSON)

**Đặc điểm:**

- Chỉ đọc dữ liệu (không tốn gas)
- Tự động parse JSON data thành object
- Có `queryKey` để cache với React Query
- Dùng cho tính năng truy xuất nguồn gốc sản phẩm

---

## 💡 Lưu ý sử dụng

### Workflow điển hình:

1. **Đăng ký công ty:** `registerCompany()`
2. **Tạo nông trại:** `createFarmSupplyChain()` → `getContractAgriAddress()`
3. **Thêm sản phẩm:** `addProductToSupplyChain()`
4. **Cập nhật quy trình:** `updateProductProcesses()` và `updateProductStatus()`
5. **Truy vấn thông tin:** `getProductByBatch()`

### Xử lý lỗi:

- Tất cả các hàm đều có try-catch và log lỗi chi tiết
- Ném lại lỗi để component xử lý
- Có message lỗi tiếng Việt dễ hiểu

### Performance:

- Các hàm read-only có thể cache với React Query
- Sử dụng `queryKey` để quản lý cache
- Transaction functions không cache vì có side effects
