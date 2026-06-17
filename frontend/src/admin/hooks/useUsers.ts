import { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserStats } from '../types/userAdmins';
import api from '../../services/api'; 

export interface SystemRole {
    id: number;
    name: string;
    displayName: string;
    color: string;
}

interface SpringBootPageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [updating, setUpdating] = useState<boolean>(false);
    
    const [page, setPage] = useState<number>(1); 
    const [rowsPerPage] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalElements, setTotalElements] = useState<number>(0);

    const [availableRoles, setAvailableRoles] = useState<SystemRole[]>([]);
    
    // Tạo thêm state để lưu trữ số liệu thống kê chuẩn xác từ toàn bộ DB
    const [dbStats, setDbStats] = useState<UserStats>({
        total: 0, active: 0, locked: 0, admin: 0, user: 0, newThisMonth: 0
    });

    // 1. Tải danh sách người dùng phân trang
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const springPage = page - 1; 
            const response = await api.get<SpringBootPageResponse<User>>('/admin/users', {
                params: { page: springPage, size: rowsPerPage, sortBy: 'id', direction: 'desc' }
            });
            setUsers(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch (error) {
            console.error("Lỗi tải danh sách người dùng:", error);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage]);

    // 2. Tải danh mục Roles từ DB
    const fetchAvailableRoles = useCallback(async () => {
        try {
            const response = await api.get<SystemRole[]>('/admin/users/roles');
            setAvailableRoles(response.data);
        } catch (error) {
            console.error("Không thể lấy danh mục Roles từ DB:", error);
        }
    }, []);

    // 2B. Tải số liệu thống kê (BE trả Map<String, Long>)
    const fetchUserStats = useCallback(async () => {
        try {
            const response = await api.get<{
                total: number;
                active: number;
                locked: number;
                admin: number;
            }>('/admin/users/stats');
            const d = response.data;
            setDbStats({
                total:        d.total  ?? 0,
                active:       d.active ?? 0,
                locked:       d.locked ?? 0,
                admin:        d.admin  ?? 0,
                user:         0,
                newThisMonth: 0,
            });
        } catch (error) {
            console.error("Không thể tải số liệu thống kê người dùng thực tế:", error);
        }
    }, []);

    // Kích hoạt nạp dữ liệu đồng bộ khi mount component hoặc đổi trang
    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        void fetchAvailableRoles();
        void fetchUserStats();
    }, [fetchAvailableRoles, fetchUserStats]);

    // Làm mới toàn bộ màn hình một cách tập trung
    const refreshAllData = async () => {
        await Promise.all([fetchUsers(), fetchUserStats()]);
    };

    // 3. Thêm thành viên mới
    const addUser = async (userData: any, successCallback?: () => void) => {
        try {
            setUpdating(true);
            const response = await api.post<string>('/admin/users', userData);
            alert(response.data); 
            await refreshAllData();
            if (successCallback) successCallback();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data || "Không thể thêm người dùng mới!");
        } finally {
            setUpdating(false);
        }
    };

    // 4. Thêm vai trò mới vào hệ thống
    const addSystemRole = async (roleData: { name: string; displayName: string; color: string }) => {
        try {
            setUpdating(true);
            await api.post('/admin/users/roles', roleData);
            alert("Thêm vai trò hệ thống mới thành công!");
            await fetchAvailableRoles();
        } catch (error: any) {
            alert(error.response?.data || "Thao tác thêm vai trò mới thất bại!");
        } finally {
            setUpdating(false);
        }
    };

    // 5. Xóa vai trò ra khỏi hệ thống
    const deleteSystemRole = async (roleId: number) => {
        try {
            setUpdating(true);
            const response = await api.delete<string>(`/admin/users/roles/${roleId}`);
            alert(response.data);
            await fetchAvailableRoles();
            await fetchUsers();
        } catch (error: any) {
            alert(error.response?.data || "Xóa vai trò hệ thống thất bại!");
        } finally {
            setUpdating(false);
        }
    };

    // 6. Khóa / Mở khóa tài khoản khách hàng nhanh
    const toggleLock = async (id: number) => {
        try {
            setUpdating(true);
            const response = await api.patch<string>(`/admin/users/${id}/toggle-lock`);
            alert(response.data); 
            await refreshAllData();
        } catch (error: any) {
            alert(error.response?.data || "Lỗi thực thi khóa tài khoản!");
        } finally {
            setUpdating(false);
        }
    };

    // 7. Kích hoạt / Vô hiệu hóa hoạt động thành viên
    const toggleStatus = async (id: number) => {
        try {
            setUpdating(true);
            const response = await api.patch<string>(`/admin/users/${id}/toggle-status`);
            alert(response.data); 
            await refreshAllData();
        } catch (error: any) {
            alert(error.response?.data || "Lỗi thực thi kích hoạt trạng thái!");
        } finally {
            setUpdating(false);
        }
    };

    // 8. Cập nhật phân quyền hạn truy cập hệ thống công việc
    const updateUserRoles = async (id: number, targetRoleNames: string[], successCallback?: () => void) => {
        try {
            setUpdating(true);
            const targetRoleIds = targetRoleNames
                .map(name => availableRoles.find(r => r.name === name)?.id)
                .filter((id): id is number => id !== undefined);

            const response = await api.put<string>(`/admin/users/${id}/roles`, targetRoleIds);
            alert(response.data); 
            await fetchUsers();
            if (successCallback) successCallback();
        } catch (error: any) {
            alert(error.response?.data || "Lỗi cập nhật quyền hạn!");
        } finally {
            setUpdating(false);
        }
    };

    // 9. Xóa thành viên vĩnh viễn (Sử dụng cẩn thận do dính khóa ngoại giỏ hàng/đơn hàng)
    const deleteUser = async (id: number, successCallback?: () => void) => {
        try {
            setUpdating(true);
            const response = await api.delete<string>(`/admin/users/${id}`);
            alert(response.data);
            await refreshAllData();
            if (successCallback) successCallback();
        } catch (error: any) {
            alert(error.response?.data || "Lỗi xóa dữ liệu người dùng!");
        } finally {
            setUpdating(false);
        }
    };

    return {
        loading, 
        page, 
        setPage, 
        rowsPerPage, 
        paginatedUsers: users, 
        totalPages, 
        stats: dbStats, // Trả về số liệu thống kê chính xác tuyệt đối từ DB
        updating,
        addUser, 
        toggleLock, 
        toggleStatus, 
        updateUserRoles, 
        deleteUser, 
        availableRoles, 
        addSystemRole, 
        deleteSystemRole, 
        refreshData: fetchUsers, 
        refreshRoles: fetchAvailableRoles
    };
};

export default useUsers;