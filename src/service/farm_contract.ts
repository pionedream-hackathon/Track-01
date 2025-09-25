import {
  BrowserProvider,
  Contract,
  ContractRunner,
  Eip1193Provider,
} from 'ethers';
import {AGRI_SUPPLYCHAIN_ABI, FARM_TRACEABILITY_ABI} from '../contracts/abi';
import {CONTRACT_ADDRESSES} from '../contracts/FarmTraceability';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ContractResponse {
  contractAddress: string;
  contractName: string;
  isContract: boolean;
  isVerified: boolean;
  data: any;
}

interface ProductInfo {
  id: string;
  productName: string;
  productData: any;
  status: string;
  careActivityData: any;
}

interface CompanyRegistration {
  businessID: string;
  name: string;
  wallet: string;
  walletProvider: Eip1193Provider;
}

interface FarmCreation {
  businessID: string;
  farmName: string;
  farmData: string;
  walletProvider: Eip1193Provider;
}

interface ProductAddition {
  productId: string;
  productName: string;
  productData: string;
  walletProvider: Eip1193Provider;
  contractAgri: string;
}

interface ProductUpdate {
  productId: string;
  batch: string;
  walletProvider: Eip1193Provider;
  contractAgri: string;
}

interface ProcessUpdate extends ProductUpdate {
  newProcesses: string;
}

interface StatusUpdate extends ProductUpdate {
  status: string;
}

interface ProductQuery extends ProductUpdate {}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_MESSAGES = {
  NO_WALLET: 'Không tìm thấy ví blockchain. Vui lòng kết nối ví trước.',
  NO_SIGNER: 'Không thể lấy thông tin người ký từ ví.',
  INVALID_CONTRACT: 'Địa chỉ contract không hợp lệ',
  INVALID_HASH: 'Transaction hash không hợp lệ',
  NO_CONTRACT_FOUND: 'Không tìm thấy contract trong transaction',
  PRODUCT_EXISTS: 'đã tồn tại trong hệ thống',
} as const;

// Lấy đỉa chỉ contract logs từ một transaction hash được tạo bởi hàm createSupplyChain
const API_ENDPOINTS = {
  TRANSACTION_LOGS: (hash: string) =>
    `https://zeroscan.org/api/v2/transactions/${hash}/logs`,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Tạo contract instance cho Farm Traceability
 */
const createFarmContract = (
  signerOrProvider: ContractRunner | null,
): Contract => {
  return new Contract(
    CONTRACT_ADDRESSES.FARM_TRACEABILITY, // địa chỉ contract
    FARM_TRACEABILITY_ABI, // ABI của contract
    signerOrProvider, // signer để ký và gửi transaction , hoặc provider để đọc dữ liệu
  );
};

/**
 * Tạo contract instance cho Supply Chain
 */
const createSupplyChainContract = (
  contractAddress: string,
  signerOrProvider: ContractRunner | null,
): Contract => {
  if (!contractAddress) {
    throw new Error(ERROR_MESSAGES.INVALID_CONTRACT);
  }
  return new Contract(contractAddress, AGRI_SUPPLYCHAIN_ABI, signerOrProvider);
};

/**
 * Khởi tạo provider và signer từ wallet
 */
const initializeProviderAndSigner = async (walletProvider: Eip1193Provider) => {
  if (!walletProvider) {
    throw new Error(ERROR_MESSAGES.NO_WALLET);
  }

  try {
    const provider = new BrowserProvider(walletProvider);
    const signer = await provider.getSigner();

    if (!signer) {
      throw new Error(ERROR_MESSAGES.NO_SIGNER);
    }

    return {provider, signer};
  } catch (error) {
    console.error('❌ Lỗi khởi tạo provider và signer:', error);
    throw error;
  }
};

/**
 * Chuyển đổi data thành JSON string
 */
const convertToJsonString = (data: any): string => {
  return typeof data === 'string' ? data : JSON.stringify(data);
};

/**
 * Parse JSON data an toàn
 */
const safeParseJson = (jsonString: string, fallback: any = null): any => {
  try {
    return JSON.parse(jsonString || 'null');
  } catch {
    return fallback;
  }
};

/**
 * Validate input parameters
 */
const validateInput = (
  params: Record<string, any>,
  requiredFields: string[],
) => {
  for (const field of requiredFields) {
    if (!params[field]) {
      throw new Error(`Thiếu thông tin bắt buộc: ${field}`);
    }
  }
};

/**
 * Log transaction thành công
 */
const logSuccess = (action: string, receipt: any) => {
  console.log(`✅ ${action} thành công:`, {
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
  });
};

// ============================================================================
// COMPANY OPERATIONS
// ============================================================================

/**
 * Lấy thông tin công ty từ blockchain
 */
export const getCompanyInfo = async (
  walletProvider: Eip1193Provider,
  businessID: string,
) => {
  validateInput({walletProvider, businessID}, ['walletProvider', 'businessID']);

  try {
    const provider = new BrowserProvider(walletProvider);
    const contract = createFarmContract(provider);
    const info = await contract.getCompanyInfo(String(businessID));

    console.log('✅ Lấy thông tin công ty thành công:', info);
    return info;
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin công ty:', error);
    throw error;
  }
};

/**
 * Đăng ký công ty mới
 */
export const registerCompany = async (params: CompanyRegistration) => {
  validateInput(params, ['businessID', 'name', 'wallet', 'walletProvider']);

  try {
    const {signer} = await initializeProviderAndSigner(params.walletProvider);
    const contract = createFarmContract(signer);

    const tx = await contract.registerCompany(
      String(params.businessID),
      params.name,
      params.wallet,
    );
    const receipt = await tx.wait();

    logSuccess('Đăng ký công ty', receipt);
    return receipt.hash;
  } catch (error) {
    console.error('❌ Lỗi đăng ký công ty:', error);
    throw error;
  }
};

// ============================================================================
// FARM OPERATIONS
// ============================================================================

/**
 * Tạo chuỗi cung ứng cho nông trại
 */
export const createFarmSupplyChain = async (params: FarmCreation) => {
  validateInput(params, ['businessID', 'farmName', 'walletProvider']);

  try {
    const {signer} = await initializeProviderAndSigner(params.walletProvider);
    const contract = createFarmContract(signer);

    const tx = await contract.createSupplyChain(
      String(params.businessID),
      params.farmName,
      convertToJsonString(params.farmData),
    );
    const receipt = await tx.wait();

    logSuccess('Tạo chuỗi cung ứng nông trại', receipt);
    return receipt.hash;
  } catch (error) {
    console.error('❌ Lỗi tạo chuỗi cung ứng:', error);
    throw error;
  }
};

// ============================================================================
// CONTRACT ADDRESS OPERATIONS
// ============================================================================

/**
 * Lấy địa chỉ contract từ transaction hash
 */
export const getContractAddress = async (
  hash: string,
): Promise<ContractResponse> => {
  if (!hash) {
    throw new Error(ERROR_MESSAGES.INVALID_HASH);
  }

  try {
    console.log('📝 Lấy địa chỉ contract từ transaction:', hash);

    const response = await fetch(API_ENDPOINTS.TRANSACTION_LOGS(hash));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const contractItem = data.items?.[0];

    if (!contractItem) {
      throw new Error(ERROR_MESSAGES.NO_CONTRACT_FOUND);
    }

    return {
      contractAddress: contractItem.address.hash,
      contractName: contractItem.address.name,
      isContract: contractItem.address.is_contract,
      isVerified: contractItem.address.is_verified,
      data,
    };
  } catch (error) {
    console.error('❌ Lỗi lấy địa chỉ contract:', error);
    throw error;
  }
};

// ============================================================================
// PRODUCT OPERATIONS
// ============================================================================

/**
 * Kiểm tra sản phẩm đã tồn tại
 */
const checkProductExists = async (
  contract: Contract,
  productId: string,
): Promise<void> => {
  try {
    const hasProduct = await contract.hasProduct(productId);
    if (hasProduct) {
      throw new Error(`Sản phẩm ${productId} ${ERROR_MESSAGES.PRODUCT_EXISTS}`);
    }
  } catch (error: any) {
    if (error.message.includes(ERROR_MESSAGES.PRODUCT_EXISTS)) {
      throw error;
    }
    // Bỏ qua lỗi nếu contract không có method hasProduct
    console.log('⚠️ Không thể kiểm tra sản phẩm tồn tại, tiếp tục...');
  }
};

/**
 * Thêm sản phẩm vào chuỗi cung ứng
 */
export const addProductToSupplyChain = async (params: ProductAddition) => {
  validateInput(params, [
    'productId',
    'productName',
    'walletProvider',
    'contractAgri',
  ]);

  try {
    console.log('📦 Thêm sản phẩm vào chuỗi cung ứng:', {
      productId: params.productId,
      productName: params.productName,
      contractAgri: params.contractAgri,
    });

    const {signer} = await initializeProviderAndSigner(params.walletProvider);
    const contract = createSupplyChainContract(params.contractAgri, signer);

    const productId = String(params.productId);
    await checkProductExists(contract, productId);

    const tx = await contract.addProduct(
      productId,
      params.productName,
      convertToJsonString(params.productData),
    );
    const receipt = await tx.wait();

    logSuccess('Thêm sản phẩm', receipt);
    return receipt.hash;
  } catch (error) {
    console.error('❌ Lỗi thêm sản phẩm:', error);
    throw error;
  }
};

/**
 * Cập nhật quy trình sản xuất
 */
export const updateProductProcesses = async (params: ProcessUpdate) => {
  validateInput(params, [
    'productId',
    'batch',
    'newProcesses',
    'walletProvider',
    'contractAgri',
  ]);

  try {
    const {signer} = await initializeProviderAndSigner(params.walletProvider);
    const contract = createSupplyChainContract(params.contractAgri, signer);

    console.log('📝 Cập nhật quy trình sản phẩm:', {
      productId: params.productId,
      batch: params.batch,
      contractAgri: params.contractAgri,
    });

    const tx = await contract.updateProductProcesses(
      String(params.productId),
      String(params.batch),
      convertToJsonString(params.newProcesses),
    );
    const receipt = await tx.wait();

    logSuccess('Cập nhật quy trình', receipt);
    return receipt.hash;
  } catch (error) {
    console.error('❌ Lỗi cập nhật quy trình:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái sản phẩm
 */
export const updateProductStatus = async (params: StatusUpdate) => {
  validateInput(params, [
    'productId',
    'batch',
    'status',
    'walletProvider',
    'contractAgri',
  ]);

  try {
    const {signer} = await initializeProviderAndSigner(params.walletProvider);
    const contract = createSupplyChainContract(params.contractAgri, signer);

    console.log('📝 Cập nhật trạng thái sản phẩm:', {
      productId: params.productId,
      batch: params.batch,
      status: params.status,
      contractAgri: params.contractAgri,
    });

    const tx = await contract.updateProductStatus(
      String(params.productId),
      String(params.batch),
      String(params.status),
    );
    const receipt = await tx.wait();

    logSuccess('Cập nhật trạng thái', receipt);
    return receipt.hash;
  } catch (error) {
    console.error('❌ Lỗi cập nhật trạng thái:', error);
    throw error;
  }
};

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Lấy thông tin sản phẩm theo batch
 */
export const getProductByBatch = async (params: ProductQuery) => {
  validateInput(params, [
    'productId',
    'batch',
    'walletProvider',
    'contractAgri',
  ]);

  try {
    const provider = new BrowserProvider(params.walletProvider);
    const contract = createSupplyChainContract(params.contractAgri, provider);

    const info = await contract.getProductByBatch(
      String(params.productId),
      String(params.batch),
    );

    const productInfo: ProductInfo = {
      id: info[0],
      productName: info[1],
      productData: safeParseJson(info[2]),
      status: info[3],
      careActivityData: safeParseJson(info[4]),
    };

    console.log('✅ Lấy thông tin sản phẩm thành công:', productInfo);
    return productInfo;
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin sản phẩm:', error);
    throw error;
  }
};

// ============================================================================
// QUERY KEYS FOR REACT QUERY
// ============================================================================

// Query keys for caching
getCompanyInfo.queryKey = ['blockchain', 'getCompanyInfo'];
getContractAddress.queryKey = ['blockchain', 'getContractAddress'];
getProductByBatch.queryKey = ['blockchain', 'getProductByBatch'];
