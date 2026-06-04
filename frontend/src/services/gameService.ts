// gameService.ts
import api from './api';

export interface Prize {
  id: number;
  name: string;
  description?: string;
  type: 'points' | 'discount' | 'voucher' | 'empty';
  value: number;
  icon: string;
  color: string;
  textColor: string;
  active: boolean;
  probability?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSpinProfile {
  userId: number;
  user: {
    id: number;
    email: string;
    fullName?: string;
  };
  points: number;
  lastSpinDate: string | null;
  totalSpins?: number;
}

export interface Statistics {
  totalUsers: number;
  totalPoints: number;
  usersSpunToday: number;
  averagePoints: number;
}

export interface GameStatistics {
  totalUsers: number;
  totalPoints: number;
  usersSpunToday: number;
  averagePoints: number;
}

class GameService {
  private currentUser: any = null;

  constructor() {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  isAdmin(): boolean {
    if (!this.currentUser) return false;
    
    // Kiểm tra role từ user object
    const roles = this.currentUser.roles || this.currentUser.authorities || [];
    if (Array.isArray(roles)) {
      return roles.some((role: any) => {
        const roleName = typeof role === 'string' ? role : role.authority || role.name;
        return roleName === 'ADMIN' || roleName === 'ROLE_ADMIN';
      });
    }
    
    return this.currentUser?.email?.includes('admin') || false;
  }

  // ==================== ADMIN ENDPOINTS (Gọi đúng backend) ====================
  
  /**
   * Get all prizes - Dùng endpoint /api/admin/lucky-wheel/prizes
   */
  async getPrizes(): Promise<Prize[]> {
    try {
      const response = await api.get('/admin/lucky-wheel/prizes');
      return response.data;
    } catch (error) {
      console.error('Error fetching prizes:', error);
      throw error;
    }
  }

  /**
   * Get all user spin profiles - Cần thêm endpoint mới
   */
  async getUserSpinProfiles(): Promise<UserSpinProfile[]> {
    try {
      // Backend chưa có endpoint này, tạm thời lấy từ /api/admin/lucky-wheel/profiles
      // Nếu chưa có, bạn cần thêm vào AdminLuckyWheelController:
      // @GetMapping("/profiles")
      // public ResponseEntity<List<UserSpinProfile>> getAllProfiles() {
      //     return ResponseEntity.ok(adminService.getAllSpinProfiles());
      // }
      const response = await api.get('/admin/lucky-wheel/profiles');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      // Fallback: lấy từ users API
      const usersResponse = await api.get('/users');
      const users = usersResponse.data;
      return users.map((user: any) => ({
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        },
        points: user.points || 0,
        lastSpinDate: user.lastSpinDate || null
      }));
    }
  }

  /**
   * Get statistics - Dùng endpoint /api/admin/lucky-wheel/statistics
   */
  async getStatistics(): Promise<Statistics> {
    try {
      const response = await api.get('/admin/lucky-wheel/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * Create new prize - Dùng endpoint /api/admin/lucky-wheel/prizes
   */
  async createPrize(prize: Omit<Prize, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prize> {
    try {
      const response = await api.post('/admin/lucky-wheel/prizes', prize);
      return response.data;
    } catch (error) {
      console.error('Error creating prize:', error);
      throw error;
    }
  }

  /**
   * Update prize - Dùng endpoint /api/admin/lucky-wheel/prizes/{id}
   */
  async updatePrize(id: number, prize: Partial<Prize>): Promise<Prize> {
    try {
      const response = await api.put(`/admin/lucky-wheel/prizes/${id}`, prize);
      return response.data;
    } catch (error) {
      console.error('Error updating prize:', error);
      throw error;
    }
  }

  /**
   * Delete prize - Dùng endpoint /api/admin/lucky-wheel/prizes/{id}
   */
  async deletePrize(id: number): Promise<void> {
    try {
      await api.delete(`/admin/lucky-wheel/prizes/${id}`);
    } catch (error) {
      console.error('Error deleting prize:', error);
      throw error;
    }
  }

  /**
   * Toggle prize status - Dùng endpoint /api/admin/lucky-wheel/prizes/{id}/toggle
   */
  async togglePrizeStatus(id: number): Promise<void> {
    try {
      await api.patch(`/admin/lucky-wheel/prizes/${id}/toggle`);
    } catch (error) {
      console.error('Error toggling prize status:', error);
      throw error;
    }
  }

  /**
   * Add points to user - Dùng endpoint /api/admin/lucky-wheel/users/{userId}/points
   */
  async addPoints(userId: number, points: number): Promise<UserSpinProfile> {
    try {
      const response = await api.post(`/admin/lucky-wheel/users/${userId}/points`, { points });
      return response.data;
    } catch (error) {
      console.error('Error adding points:', error);
      throw error;
    }
  }

  /**
   * Reset spin limit - Dùng endpoint /api/admin/lucky-wheel/users/{userId}/reset
   */
  async resetSpinLimit(userId: number): Promise<UserSpinProfile> {
    try {
      const response = await api.post(`/admin/lucky-wheel/users/${userId}/reset`);
      return response.data;
    } catch (error) {
      console.error('Error resetting spin limit:', error);
      throw error;
    }
  }

  // ==================== USER ENDPOINTS ====================
  
  async getUserSpinProfile(): Promise<UserSpinProfile> {
    try {
      // Nếu có endpoint thì dùng, không thì lấy từ currentUser
      const response = await api.get('/lucky-wheel/profile');
      return response.data;
    } catch (error) {
      // Fallback: tạo từ currentUser
      if (this.currentUser) {
        return {
          userId: this.currentUser.id,
          user: {
            id: this.currentUser.id,
            email: this.currentUser.email,
            fullName: this.currentUser.fullName
          },
          points: this.currentUser.points || 0,
          lastSpinDate: this.currentUser.lastSpinDate || null
        };
      }
      throw error;
    }
  }

  async spin(): Promise<any> {
    try {
      const response = await api.post('/lucky-wheel/spin');
      return response.data;
    } catch (error) {
      console.error('Error spinning:', error);
      throw error;
    }
  }

  async getSpinHistory(limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      const response = await api.get('/lucky-wheel/history', { params: { limit, offset } });
      return response.data;
    } catch (error) {
      console.error('Error fetching spin history:', error);
      return [];
    }
  }

  async getAvailablePrizes(): Promise<Prize[]> {
    return this.getPrizes();
  }
}

export default new GameService();