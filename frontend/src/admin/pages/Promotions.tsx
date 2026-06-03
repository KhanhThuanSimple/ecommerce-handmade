import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    PlayIcon,
    StopIcon,
    CogIcon,
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    KeyIcon,
    GlobeAltIcon,
    ServerIcon,
    TagIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { useNotify } from '../../components/NotificationContext';
import api from '../../services/api';

// Types
interface AiConfig {
    id: number;
    configKey: string;
    configValue: string;
    description: string;
    updatedAt: string;
}

interface ChatFaq {
    id: number;
    keywords: string;
    responseText: string;
    isActive: boolean;
    createdAt: string;
}

const Promotions: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'config' | 'faq'>('config');
    const [configs, setConfigs] = useState<AiConfig[]>([]);
    const [faqs, setFaqs] = useState<ChatFaq[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showFaqModal, setShowFaqModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AiConfig | null>(null);
    const [editingFaq, setEditingFaq] = useState<ChatFaq | null>(null);
    const [configForm, setConfigForm] = useState({
        configKey: '',
        configValue: '',
        description: ''
    });
    const [faqForm, setFaqForm] = useState({
        keywords: '',
        responseText: '',
        isActive: true
    });
    const [testResult, setTestResult] = useState<string>('');
    const [testing, setTesting] = useState(false);
    
    const notify = useNotify();

    // Fetch data
    useEffect(() => {
        fetchConfigs();
        fetchFaqs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await api.get('/admin/chat-config/all');
            setConfigs(res.data);
        } catch (error) {
            console.error('Error fetching configs:', error);
            notify.error('Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const fetchFaqs = async () => {
        try {
            const res = await api.get('/admin/chat-faq/all');
            setFaqs(res.data);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            notify.error('Không thể tải FAQ');
        }
    };

    const testConnection = async () => {
        setTesting(true);
        try {
            const res = await api.get('/admin/chat-config/test-connection');
            setTestResult(res.data.result);
            if (res.data.result.includes('thành công')) {
                notify.success('Kết nối AI thành công!');
            } else {
                notify.warning(res.data.result);
            }
        } catch (error) {
            setTestResult('Kết nối thất bại');
            notify.error('Không thể kết nối đến AI');
        } finally {
            setTesting(false);
            setTimeout(() => setTestResult(''), 5000);
        }
    };

    // Config CRUD
    const handleSaveConfig = async () => {
        if (!configForm.configKey || !configForm.configValue) {
            notify.warning('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            if (editingConfig) {
                const res = await api.post('/admin/chat-config/update', configForm);
                notify.success('Cập nhật cấu hình thành công');
                setConfigs(configs.map(c => c.id === editingConfig.id ? res.data.config : c));
            } else {
                const res = await api.post('/admin/chat-config/create', configForm);
                notify.success('Tạo cấu hình thành công');
                setConfigs([...configs, res.data.config]);
            }
            setShowConfigModal(false);
            resetConfigForm();
        } catch (error: any) {
            notify.error(error.response?.data?.error || 'Lưu thất bại');
        }
    };

    const handleDeleteConfig = async (key: string) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa cấu hình "${key}"?`)) {
            try {
                await api.delete(`/admin/chat-config/delete/${key}`);
                setConfigs(configs.filter(c => c.configKey !== key));
                notify.success('Xóa cấu hình thành công');
            } catch (error) {
                notify.error('Xóa thất bại');
            }
        }
    };

    // FAQ CRUD
    const handleSaveFaq = async () => {
        if (!faqForm.keywords || !faqForm.responseText) {
            notify.warning('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            if (editingFaq) {
                const res = await api.put(`/admin/chat-faq/update/${editingFaq.id}`, faqForm);
                notify.success('Cập nhật FAQ thành công');
                setFaqs(faqs.map(f => f.id === editingFaq.id ? res.data.faq : f));
            } else {
                const res = await api.post('/admin/chat-faq/create', faqForm);
                notify.success('Tạo FAQ thành công');
                setFaqs([...faqs, res.data.faq]);
            }
            setShowFaqModal(false);
            resetFaqForm();
        } catch (error: any) {
            notify.error(error.response?.data?.error || 'Lưu thất bại');
        }
    };

    const handleDeleteFaq = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa FAQ này?')) {
            try {
                await api.delete(`/admin/chat-faq/delete/${id}`);
                setFaqs(faqs.filter(f => f.id !== id));
                notify.success('Xóa FAQ thành công');
            } catch (error) {
                notify.error('Xóa thất bại');
            }
        }
    };

    const handleToggleFaqStatus = async (faq: ChatFaq) => {
        try {
            const res = await api.patch(`/admin/chat-faq/toggle/${faq.id}`);
            setFaqs(faqs.map(f => 
                f.id === faq.id ? { ...f, isActive: !f.isActive } : f
            ));
            notify.success(res.data.message);
        } catch (error) {
            notify.error('Thao tác thất bại');
        }
    };

    // Reset forms
    const resetConfigForm = () => {
        setConfigForm({ configKey: '', configValue: '', description: '' });
        setEditingConfig(null);
    };

    const resetFaqForm = () => {
        setFaqForm({ keywords: '', responseText: '', isActive: true });
        setEditingFaq(null);
    };

    // Helper functions
    const getConfigIcon = (key: string) => {
        if (key.includes('API_KEY')) return <KeyIcon className="w-5 h-5" />;
        if (key.includes('URL')) return <GlobeAltIcon className="w-5 h-5" />;
        if (key.includes('PROMPT')) return <DocumentTextIcon className="w-5 h-5" />;
        if (key.includes('MODEL')) return <ServerIcon className="w-5 h-5" />;
        return <CogIcon className="w-5 h-5" />;
    };

    const getConfigCategory = (key: string) => {
        if (key.includes('GROQ')) return 'Groq API';
        if (key.includes('PROMPT')) return 'Prompt';
        if (key.includes('POLICY')) return 'Chính sách';
        if (key.includes('ADDRESS')) return 'Thông tin shop';
        return 'Khác';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="admin-chat-container">
            {/* Header */}
            <div className="admin-chat-header">
                <div className="header-title">
                    <ChatBubbleLeftRightIcon className="w-8 h-8" />
                    <div>
                        <h1>Quản Lý Chatbot AI</h1>
                        <p className="header-subtitle">
                            Cấu hình AI và quản lý câu hỏi thường gặp (FAQ)
                        </p>
                    </div>
                </div>
                <button 
                    className="test-connection-btn"
                    onClick={testConnection}
                    disabled={testing}
                >
                    {testing ? 'Đang kiểm tra...' : '🔌 Kiểm tra kết nối AI'}
                </button>
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`test-result ${testResult.includes('thành công') ? 'success' : 'error'}`}>
                    {testResult}
                </div>
            )}

            {/* Tabs */}
            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    <CogIcon className="w-5 h-5" />
                    Cấu hình AI
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
                    onClick={() => setActiveTab('faq')}
                >
                    <DocumentTextIcon className="w-5 h-5" />
                    Quản lý FAQ
                </button>
            </div>

            {/* Config Tab */}
            {activeTab === 'config' && (
                <div className="config-tab">
                    <div className="tab-header">
                        <h2>Cấu hình hệ thống AI</h2>
                        <button 
                            className="create-btn"
                            onClick={() => {
                                resetConfigForm();
                                setShowConfigModal(true);
                            }}
                        >
                            <PlusIcon className="w-5 h-5" />
                            Thêm cấu hình
                        </button>
                    </div>

                    <div className="configs-grid">
                        {configs.map((config) => (
                            <div key={config.id} className="config-card">
                                <div className="config-card-header">
                                    <div className="config-icon">
                                        {getConfigIcon(config.configKey)}
                                    </div>
                                    <div className="config-info">
                                        <h3>{config.configKey}</h3>
                                        <span className="config-category">{getConfigCategory(config.configKey)}</span>
                                    </div>
                                </div>
                                <div className="config-card-body">
                                    <div className="config-value">
                                        <strong>Giá trị:</strong>
                                        <code>{config.configValue}</code>
                                    </div>
                                    {config.description && (
                                        <div className="config-description">
                                            <strong>Mô tả:</strong>
                                            <p>{config.description}</p>
                                        </div>
                                    )}
                                    <div className="config-updated">
                                        Cập nhật: {new Date(config.updatedAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                                <div className="config-card-footer">
                                    <button 
                                        className="card-btn edit"
                                        onClick={() => {
                                            setEditingConfig(config);
                                            setConfigForm({
                                                configKey: config.configKey,
                                                configValue: config.configValue,
                                                description: config.description || ''
                                            });
                                            setShowConfigModal(true);
                                        }}
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Sửa
                                    </button>
                                    <button 
                                        className="card-btn delete"
                                        onClick={() => handleDeleteConfig(config.configKey)}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
                <div className="faq-tab">
                    <div className="tab-header">
                        <h2>Câu hỏi thường gặp (FAQ)</h2>
                        <button 
                            className="create-btn"
                            onClick={() => {
                                resetFaqForm();
                                setShowFaqModal(true);
                            }}
                        >
                            <PlusIcon className="w-5 h-5" />
                            Thêm FAQ
                        </button>
                    </div>

                    <div className="faqs-grid">
                        {faqs.map((faq) => (
                            <div key={faq.id} className={`faq-card ${!faq.isActive ? 'inactive' : ''}`}>
                                <div className="faq-card-header">
                                    <div className="faq-keywords">
                                        <TagIcon className="w-4 h-4" />
                                        {faq.keywords.split(',').map((kw, i) => (
                                            <span key={i} className="keyword-tag">{kw.trim()}</span>
                                        ))}
                                    </div>
                                    <div className="faq-status">
                                        {faq.isActive ? (
                                            <span className="status-badge active">
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Hoạt động
                                            </span>
                                        ) : (
                                            <span className="status-badge inactive">
                                                <XCircleIcon className="w-4 h-4" />
                                                Tạm dừng
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="faq-card-body">
                                    <div className="faq-response">
                                        {faq.responseText}
                                    </div>
                                    <div className="faq-date">
                                        Tạo: {new Date(faq.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                                <div className="faq-card-footer">
                                    <button 
                                        className="card-btn edit"
                                        onClick={() => {
                                            setEditingFaq(faq);
                                            setFaqForm({
                                                keywords: faq.keywords,
                                                responseText: faq.responseText,
                                                isActive: faq.isActive
                                            });
                                            setShowFaqModal(true);
                                        }}
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Sửa
                                    </button>
                                    <button 
                                        className={`card-btn ${faq.isActive ? 'deactivate' : 'activate'}`}
                                        onClick={() => handleToggleFaqStatus(faq)}
                                    >
                                        {faq.isActive ? (
                                            <>
                                                <StopIcon className="w-4 h-4" />
                                                Tạm dừng
                                            </>
                                        ) : (
                                            <>
                                                <PlayIcon className="w-4 h-4" />
                                                Kích hoạt
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="card-btn delete"
                                        onClick={() => handleDeleteFaq(faq.id)}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Config Modal */}
            {showConfigModal && (
                <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
                    <div className="config-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingConfig ? 'Chỉnh sửa cấu hình' : 'Thêm cấu hình mới'}</h3>
                            <button className="modal-close" onClick={() => setShowConfigModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Key <span className="required">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="VD: SYSTEM_PROMPT"
                                    value={configForm.configKey}
                                    onChange={(e) => setConfigForm({ ...configForm, configKey: e.target.value.toUpperCase() })}
                                    disabled={!!editingConfig}
                                />
                                <small>Tên cấu hình, viết hoa và dùng dấu gạch dưới</small>
                            </div>
                            
                            <div className="form-group">
                                <label>Value <span className="required">*</span></label>
                                <textarea 
                                    rows={4}
                                    placeholder="Giá trị cấu hình..."
                                    value={configForm.configValue}
                                    onChange={(e) => setConfigForm({ ...configForm, configValue: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Mô tả ngắn về cấu hình này..."
                                    value={configForm.description}
                                    onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowConfigModal(false)}>Hủy</button>
                            <button className="btn-submit" onClick={handleSaveConfig}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAQ Modal */}
            {showFaqModal && (
                <div className="modal-overlay" onClick={() => setShowFaqModal(false)}>
                    <div className="faq-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingFaq ? 'Chỉnh sửa FAQ' : 'Thêm câu hỏi mới'}</h3>
                            <button className="modal-close" onClick={() => setShowFaqModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Từ khóa <span className="required">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="VD: giá, báo giá, bao nhiêu tiền"
                                    value={faqForm.keywords}
                                    onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })}
                                />
                                <small>Các từ khóa cách nhau bằng dấu phẩy</small>
                            </div>
                            
                            <div className="form-group">
                                <label>Câu trả lời <span className="required">*</span></label>
                                <textarea 
                                    rows={5}
                                    placeholder="Nội dung câu trả lời..."
                                    value={faqForm.responseText}
                                    onChange={(e) => setFaqForm({ ...faqForm, responseText: e.target.value })}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input 
                                        type="checkbox"
                                        checked={faqForm.isActive}
                                        onChange={(e) => setFaqForm({ ...faqForm, isActive: e.target.checked })}
                                    />
                                    Kích hoạt ngay
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowFaqModal(false)}>Hủy</button>
                            <button className="btn-submit" onClick={handleSaveFaq}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Promotions;