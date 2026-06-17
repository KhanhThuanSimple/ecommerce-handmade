import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentArrowDownIcon,
    CreditCardIcon,
    AdjustmentsHorizontalIcon,
    ExclamationTriangleIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import '../../admin/styles/analytics.css';

// Đăng ký Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

// Cấu hình global cho Chart.js - loại bỏ điểm tròn mặc định
ChartJS.defaults.set('elements.point', {
    radius: 0,
    hoverRadius: 4,
});

ChartJS.defaults.set('plugins.legend', {
    labels: {
        usePointStyle: false,
        boxWidth: 12,
        boxHeight: 12,
    }
});

interface KPIMetric {
    value: number;
    label: string;
}

interface KPIResponse {
    revenue: KPIMetric;
    successOrders: KPIMetric;
    aov: KPIMetric;
    activeCustomers: KPIMetric;
    conversionRate: KPIMetric;
    cancellationRate: KPIMetric;
}

interface PaymentMethodAdmin {
    code: string;
    name: string;
    is_active: boolean;
    logoUrl?: string;
    description?: string;
    updated_at?: string;
}

const Analytics: React.FC = () => {
    // Quản lý Tab chính
    const [activeTab, setActiveTab] = useState<'revenue' | 'payment'>('revenue');
    const [dateRange, setDateRange] = useState<'today' | 'month' | 'year'>('month');

    // States lưu trữ dữ liệu phân tích
    const [kpiData, setKpiData] = useState<KPIResponse | null>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
    const [userDistribution, setUserDistribution] = useState<any[]>([]);
    const [orderFunnel, setOrderFunnel] = useState<any[]>([]);
    const [abandonedCartMetric, setAbandonedCartMetric] = useState<any>(null);
    const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
    const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(true);

    // States quản lý cấu hình cổng thanh toán
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAdmin[]>([]);
    const [methodsLoading, setMethodsLoading] = useState<boolean>(false);
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [formName, setFormName] = useState<string>('');
    const [formActive, setFormActive] = useState<boolean>(true);
    const [formConfig, setFormConfig] = useState<Record<string, string>>({});

    // Chart options - Line chart (đã sửa lỗi TypeScript)
    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: false,
                    boxWidth: 12,
                    boxHeight: 12,
                    padding: 10,
                    font: {
                        size: 11,
                        weight: 'normal' as const
                    }
                }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'white',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        let value = context.raw;
                        return `${label}: ${new Intl.NumberFormat('vi-VN').format(value)}₫`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#e2e8f0',
                    drawBorder: false
                },
                ticks: {
                    callback: function(value: any) {
                        return new Intl.NumberFormat('vi-VN').format(value) + '₫';
                    },
                    font: {
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    maxRotation: 30,
                    autoSkip: true
                }
            }
        },
        elements: {
            point: {
                radius: 0,
                hoverRadius: 5
            },
            line: {
                borderWidth: 2,
                tension: 0.3
            }
        }
    };

    // Chart options - Bar chart
    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: false,
                    boxWidth: 12,
                    boxHeight: 12,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                backgroundColor: 'white',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#e2e8f0',
                    drawBorder: false
                },
                ticks: {
                    stepSize: 1,
                    font: {
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 11
                    }
                }
            }
        }
    };// =========================================================
// SỬA ĐỔI HOÀN THIỆN: HÀM XUẤT FILE BÁO CÁO QUA CƠ CHẾ BLOB (BAO CHẠY)
// =========================================================
const handleExportCSV = () => {
    try {
        // 1. Tạo mảng chứa các dòng dữ liệu, nạp ký tự \uFEFF ở đầu để Excel nhận diện tiếng Việt
        const csvRows: string[] = ["\uFEFFNgày thống kê,Doanh thu hoàn thành (VND)"];
        
        // 2. Lấy dữ liệu động từ State nạp vào mảng nếu có
        if (revenueTrend && revenueTrend.length > 0) {
            revenueTrend.forEach((item) => {
                const date = item.date_label ? item.date_label : 'Không rõ';
                const revenue = item.daily_revenue !== undefined ? item.daily_revenue : 0;
                csvRows.push(`"${date}","${revenue}"`);
            });
        } else {
            csvRows.push('"Chưa có dữ liệu giao dịch thành công",0');
        }
        
        // 3. Nối các dòng lại với nhau bằng ký tự xuống dòng (\n)
        const csvString = csvRows.join("\n");
        
        // 4. CHÌA KHÓA: Chuyển đổi chuỗi thành đối tượng Blob nhị phân thực thụ
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        
        // 5. Tạo đường dẫn URL ảo trỏ vào vùng nhớ Blob này
        const blobUrl = URL.createObjectURL(blob);
        
        // 6. Thực hiện hành vi kích hoạt tải xuống ngầm
        const link = document.createElement("a");
        link.href = blobUrl;
        
        const currentDate = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `Bao_Cao_Doanh_Thu_Handmade_${dateRange}_${currentDate}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        // 7. Giải phóng vùng nhớ và xóa thẻ sau khi hoàn thành để tránh tràn bộ nhớ
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
    } catch (error) {
        console.error("Lỗi hệ thống khi kết xuất Blob CSV:", error);
        alert("Gặp lỗi không thể xuất file. Vui lòng F12 xem tab Console.");
    }
};

    // Chart options - Pie chart
    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: false,
                    boxWidth: 12,
                    boxHeight: 12,
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                backgroundColor: 'white',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };

    // =========================================================
    // 1. GỌI API THỐNG KÊ
    // =========================================================
    useEffect(() => {
        const fetchAllAnalytics = async () => {
            if (activeTab !== 'revenue') return;
            setAnalyticsLoading(true);
            try {
                const [kpiRes, productsRes, trendRes, userRes, funnelRes, abandonedRes, lowStockRes] = await Promise.all([
                    api.get(`/admin/analytics/kpi?range=${dateRange}`),
                    api.get('/admin/analytics/top-products'),
                    api.get('/admin/analytics/revenue-trend'),
                    api.get('/admin/analytics/user-status-distribution'),
                    api.get('/admin/analytics/order-status-funnel'),
                    api.get('/admin/analytics/abandoned-carts'),
                    api.get('/admin/analytics/low-stock-alert?threshold=5')
                ]);

                setKpiData(kpiRes.data);
                setRevenueTrend(trendRes.data || []);
                setUserDistribution(userRes.data || []);
                setOrderFunnel(funnelRes.data || []);
                setAbandonedCartMetric(abandonedRes.data);
                setLowStockAlerts(lowStockRes.data || []);

                const rawProducts = productsRes.data || [];
                const totalRevenueGenerated = rawProducts.reduce((sum: number, item: any) => sum + (item.total_revenue_generated || 0), 0);
                
                const structuredProducts = rawProducts.map((item: any) => ({
                    id: item.product_id,
                    name: item.product_name,
                    quantity: item.total_quantity_sold,
                    revenue: item.total_revenue_generated,
                    percentage: totalRevenueGenerated > 0 ? Math.round((item.total_revenue_generated / totalRevenueGenerated) * 100) : 0
                }));
                setTopProducts(structuredProducts);
            } catch (err) {
                console.error('Lỗi khi truy xuất hệ thống phân tích số liệu:', err);
            } finally {
                setAnalyticsLoading(false);
            }
        };

        fetchAllAnalytics();
    }, [dateRange, activeTab]);

    // =========================================================
    // 2. QUẢN LÝ PHƯƠNG THỨC THANH TOÁN
    // =========================================================
    const fetchPaymentMethods = async () => {
        setMethodsLoading(true);
        try {
            const res = await api.get('/payment/admin/methods');
            setPaymentMethods(res.data || []);
        } catch (err) {
            console.error('Lỗi tải danh sách cổng thanh toán:', err);
        } finally {
            setMethodsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'payment') {
            fetchPaymentMethods();
        }
    }, [activeTab]);

    const handleOpenEditModal = async (code: string) => {
        try {
            const res = await api.get(`/payment/admin/methods/${code}`);
            const data = res.data;
            setSelectedMethod(data);
            setFormName(data.name);
            setFormActive(data.is_active);
            setFormConfig(data.config_fields || {});
            setIsModalOpen(true);
        } catch (err) {
            alert('Không thể tải thông tin cấu hình chi tiết cổng này.');
        }
    };

    const handleConfigFieldChange = (key: string, value: string) => {
        setFormConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMethod) return;
        try {
            await api.put(`/payment/admin/methods/${selectedMethod.code}`, {
                name: formName,
                isActive: formActive,
                configData: formConfig
            });
            alert('Hệ thống cập nhật thông số Dynamic JSON thành công!');
            setIsModalOpen(false);
            fetchPaymentMethods();
        } catch (err) {
            alert('Lỗi lưu cấu hình cổng.');
        }
    };

    // =========================================================
    // 3. DATA CHO CHART
    // =========================================================
    const dynamicRevenueTrendData = {
        labels: revenueTrend.map(item => item.date_label),
        datasets: [
            {
                label: 'Doanh thu hoàn thành (VND)',
                data: revenueTrend.map(item => item.daily_revenue),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                tension: 0.3,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5,
                borderWidth: 2,
            },
        ],
    };

    const dynamicOrderFunnelData = {
        labels: orderFunnel.map(item => item.status),
        datasets: [
            {
                label: 'Số lượng đơn hàng',
                data: orderFunnel.map(item => item.count),
                backgroundColor: 'rgba(168, 85, 247, 0.8)',
                borderRadius: 6,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
            },
        ],
    };

    const dynamicUserPieData = {
        labels: userDistribution.map(item => item.name),
        datasets: [
            {
                data: userDistribution.map(item => item.value),
                backgroundColor: userDistribution.map(item => item.color || '#6b7280'),
                borderWidth: 1,
                borderColor: '#ffffff',
            },
        ],
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="analytics-container">
            {/* Header */}
            <div className="analytics-header">
                <h1 className="analytics-title">📊 Trung Tâm Quản Trị & Phân Tích Kế Hoạch</h1>
                <p className="analytics-subtitle">Phân tích hành vi mua sắm, quản trị rủi ro vận hành và cấu hình cổng thanh toán</p>
            </div>

            {/* Tabs */}
            <div className="analytics-tabs">
                <button className={`tab-link ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}>
                    <ChartBarIcon className="tab-icon" /> Thống kê & Phân tích chuyên sâu
                </button>
                <button className={`tab-link ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
                    <CreditCardIcon className="tab-icon" /> Quản lý cổng thanh toán động
                </button>
            </div>

            {/* Tab Thống kê */}
            {activeTab === 'revenue' && (
                <div className="tab-content-fade">
                    {/* Bộ lọc thời gian */}
                    <div className="date-range-picker">
                        <div className="range-buttons">
                            <button className={`range-btn ${dateRange === 'today' ? 'active' : ''}`} onClick={() => setDateRange('today')}>Hôm nay</button>
                            <button className={`range-btn ${dateRange === 'month' ? 'active' : ''}`} onClick={() => setDateRange('month')}>30 ngày qua</button>
                            <button className={`range-btn ${dateRange === 'year' ? 'active' : ''}`} onClick={() => setDateRange('year')}>Năm nay</button>
                        </div>
<button className="export-btn" onClick={handleExportCSV}>
    <DocumentArrowDownIcon className="w-4 h-4" /> Xuất báo cáo
</button>                    </div>

                    {analyticsLoading || !kpiData ? (
                        <div className="admin-loading">Đang kết nối cơ sở dữ liệu và kết xuất dữ liệu đồ thị...</div>
                    ) : (
                        <>
                            {/* KPI Cards */}
                            <div className="kpi-grid">
                                <div className="kpi-card">
                                    <div className="kpi-header">
                                        <span className="kpi-title">{kpiData.revenue.label}</span>
                                        <div className="kpi-icon revenue"><CurrencyDollarIcon className="w-5 h-5" /></div>
                                    </div>
                                    <div className="kpi-value">{formatCurrency(kpiData.revenue.value)}</div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-header">
                                        <span className="kpi-title">{kpiData.successOrders.label}</span>
                                        <div className="kpi-icon orders"><ShoppingBagIcon className="w-5 h-5" /></div>
                                    </div>
                                    <div className="kpi-value">{kpiData.successOrders.value} đơn</div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-header">
                                        <span className="kpi-title">{kpiData.aov.label}</span>
                                        <div className="kpi-icon conversion"><CurrencyDollarIcon className="w-5 h-5" /></div>
                                    </div>
                                    <div className="kpi-value">{formatCurrency(kpiData.aov.value)}</div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-header">
                                        <span className="kpi-title">{kpiData.conversionRate.label}</span>
                                        <div className="kpi-icon customers"><UsersIcon className="w-5 h-5" /></div>
                                    </div>
                                    <div className="kpi-value">{kpiData.conversionRate.value}%</div>
                                </div>
                            </div>

                            {/* Alert Cards */}
                            <div className="analytics-alert-summary-grid">
                                {abandonedCartMetric && (
                                    <div className="metric-alert-card abandoned">
                                        <TrashIcon className="w-8 h-8 text-amber-600" />
                                        <div>
                                            <h4>Phân tích giỏ hàng bị bỏ rơi (7 ngày qua)</h4>
                                            <p>Hiện có <strong>{abandonedCartMetric.abandonedCartsCount} giỏ hàng</strong> chứa <strong>{abandonedCartMetric.totalProductsStuck} sản phẩm</strong> chưa tiến hành Checkout.</p>
                                            <span className="loss-value">Giá trị cơ hội bị treo: {formatCurrency(abandonedCartMetric.potentialLossValue)}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="metric-alert-card risk">
                                    <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                                    <div>
                                        <h4>Chỉ số rủi ro vận hành trong kỳ</h4>
                                        <p>Tỷ lệ khách hàng hủy đơn hàng hoặc thanh toán thất bại: <strong>{kpiData.cancellationRate.value}%</strong></p>
                                        <span className="risk-indicator">{kpiData.cancellationRate.value > 15 ? '⚠️ Mức độ hủy đơn cao - Cần kiểm tra lại cổng' : '✓ Tỷ lệ an toàn nằm trong tầm kiểm soát'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="charts-grid">
                                <div className="chart-card full-width">
                                    <div className="chart-title"><CurrencyDollarIcon className="w-4 h-4 text-red-600" /> Biểu đồ đường biến động xu hướng doanh thu</div>
                                    <div className="chart-container line-bar-container" style={{height: '320px', position: 'relative'}}>
                                        <Line data={dynamicRevenueTrendData} options={lineChartOptions} />
                                    </div>
                                </div>
                                <div className="chart-card">
                                    <div className="chart-title"><ShoppingBagIcon className="w-4 h-4 text-purple-600" /> Đếm số lượng đơn hàng theo chuỗi trạng thái</div>
                                    <div className="chart-container line-bar-container" style={{height: '260px', position: 'relative'}}>
                                        <Bar data={dynamicOrderFunnelData} options={barChartOptions} />
                                    </div>
                                </div>
                                <div className="chart-card">
                                    <div className="chart-title"><UsersIcon className="w-4 h-4 text-emerald-600" /> Phân cấp cấu trúc tệp người dùng hệ thống</div>
                                    <div className="chart-container pie-container" style={{height: '260px', position: 'relative'}}>
                                        <Pie data={dynamicUserPieData} options={pieChartOptions} />
                                    </div>
                                </div>
                            </div>

                            {/* Tables */}
                            <div className="analytics-tables-flex-row">
                                <div className="table-block flex-2">
                                    <h3 className="table-block-title">🏆 Top 5 sản phẩm mang lại doanh thu cao nhất</h3>
                                    <table className="top-products-table">
                                        <thead>
                                            <tr>
                                                <th>Hạng</th>
                                                <th>Sản phẩm</th>
                                                <th>Số lượng đã bán</th>
                                                <th>Doanh thu đem lại</th>
                                                <th>Tỷ trọng đóng góp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topProducts.length === 0 ? (
                                                <tr><td colSpan={5} className="empty-cell">Chưa ghi nhận hóa đơn hoàn thành trong kỳ.</td></tr>
                                            ) : (
                                                topProducts.map((product, index) => (
                                                    <tr key={product.id}>
                                                        <td className="product-rank">#{index + 1}</td>
                                                        <td><span className="product-name-txt">{product.name}</span></td>
                                                        <td><strong>{product.quantity}</strong> chiếc</td>
                                                        <td>{formatCurrency(product.revenue)}</td>
                                                        <td>
                                                            <div className="revenue-bar"><div className="revenue-bar-fill" style={{ width: `${product.percentage}%` }}></div></div>
                                                            <span className="percentage-lbl">{product.percentage}%</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="table-block flex-1">
                                    <h3 className="table-block-title text-red-600">⚠️ Cảnh báo cháy kho (Tồn kho ≤ 5)</h3>
                                    <div className="low-stock-scroll-box">
                                        {lowStockAlerts.length === 0 ? (
                                            <div className="empty-stock-alert">Hàng hóa trong kho hiện tại dồi dào.</div>
                                        ) : (
                                            lowStockAlerts.map(item => (
                                                <div key={item.sku} className="low-stock-item-row">
                                                    <div className="item-meta">
                                                        <span className="item-name">{item.product_name}</span>
                                                        <small className="item-sku">SKU: {item.sku} | Biến thể: {item.variant_name}</small>
                                                    </div>
                                                    <span className={`stock-badge ${item.inventory === 0 ? 'out' : 'low'}`}>
                                                        {item.inventory === 0 ? 'Hết hàng' : `Còn ${item.inventory}`}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Tab Quản lý thanh toán */}
            {activeTab === 'payment' && (
                <div className="tab-content-fade">
                    {methodsLoading ? (
                        <div className="admin-loading">Đang tải hạ tầng cổng thanh toán động...</div>
                    ) : (
                        <div className="payment-methods-list-grid">
                            {paymentMethods.map((method) => (
                                <div key={method.code} className={`mgmt-method-card ${method.is_active ? 'online' : 'offline'}`}>
                                    <div className="card-status-badge">
                                        {method.is_active ? <span className="badge-on">● Đang hoạt động</span> : <span className="badge-off">🪛 Bảo trì / Tắt</span>}
                                    </div>
                                    <div className="card-main-body">
                                        <img src={method.logoUrl || 'https://via.placeholder.com/50'} alt={method.name} className="mgmt-method-logo" />
                                        <div className="mgmt-method-details">
                                            <h4>{method.name} <code className="code-lbl">({method.code})</code></h4>
                                            <p className="desc-txt">{method.description || 'Cổng liên kết thanh toán trực tuyến an toàn hệ thống.'}</p>
                                        </div>
                                    </div>
                                    <div className="card-footer-actions">
                                        <button className="btn-manage-config" onClick={() => handleOpenEditModal(method.code)}>
                                            <AdjustmentsHorizontalIcon className="w-4 h-4 inline mr-1" /> Cấu hình bảo mật
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal cấu hình */}
            {isModalOpen && selectedMethod && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-box">
                        <div className="modal-header">
                            <h3>Cấu hình hạ tầng: {selectedMethod.code}</h3>
                            <button className="close-x-btn" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveChanges}>
                            <div className="modal-body-scroll">
                                <div className="form-group-row">
                                    <label>Tên hiển thị phương thức:</label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                                </div>

                                <div className="form-group-row checkbox-row">
                                    <label className="toggle-label">
                                        <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
                                        Bật phương thức này tại giao diện cổng Checkout của Khách hàng
                                    </label>
                                </div>

                                <h4 className="config-section-title">🗝️ Thông số API & Mã bảo mật mã hóa (JSON Mapping)</h4>
                                <p className="config-subtitle">Cập nhật trực tiếp các trường cấu hình của đối tác mà không cần khởi động lại máy chủ.</p>

                                {Object.keys(formConfig).map((configKey) => (
                                    <div key={configKey} className="form-group-row dynamic-field">
                                        <label><code>{configKey}</code>:</label>
                                        <input type="text" value={formConfig[configKey]} onChange={(e) => handleConfigFieldChange(configKey, e.target.value)} required />
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer-actions">
                                <button type="button" className="btn-cancel-modal" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-save-modal">Lưu cấu hình</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;