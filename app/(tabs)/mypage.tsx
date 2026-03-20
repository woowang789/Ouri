import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/stores/authStore';
import { useDrive, bytesToGB } from '@/hooks/useDrive';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function MypageScreen() {
  const { user, logout, driveStatus } = useAuth();
  const driveConnected = driveStatus === 'connected';
  const { used, isLoading: driveLoading } = useDrive(driveConnected);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const borderColor = useThemeColor({}, 'border');
  const primaryLightColor = useThemeColor({}, 'primaryLight');

  // 이니셜 아바타
  const initial = user?.nickname?.charAt(0) ?? '?';

  // 가입일 포맷
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 섹션 */}
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: primaryLightColor }]}>
            <ThemedText style={[Typography.heading1, { color: primaryColor }]}>
              {initial}
            </ThemedText>
          </View>
          <ThemedText style={Typography.heading3}>{user?.nickname}</ThemedText>
          <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
            {joinDate} 가입
          </ThemedText>
        </Card>

        {/* Drive 상태 섹션 */}
        <Card style={styles.driveCard}>
          <View style={styles.driveHeader}>
            <View style={styles.driveTitleRow}>
              <View style={[styles.driveIconBg, { backgroundColor: primaryLightColor }]}>
                <Ionicons name="cloud" size={16} color={primaryColor} />
              </View>
              <ThemedText style={Typography.bodyBold}>Google Drive</ThemedText>
            </View>
            {driveConnected ? (
              <View style={[styles.statusBadge, { backgroundColor: successColor + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: successColor }]} />
                <ThemedText style={[Typography.small, { color: successColor, fontWeight: '600' }]}>
                  연동됨
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: warningColor + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: warningColor }]} />
                <ThemedText style={[Typography.small, { color: warningColor, fontWeight: '600' }]}>
                  연동 필요
                </ThemedText>
              </View>
            )}
          </View>

          {driveLoading ? (
            <ActivityIndicator size="small" color={primaryColor} style={{ paddingVertical: Spacing.sm }} />
          ) : driveConnected ? (
            <View style={styles.driveUsage}>
              <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
                Ouri 사용량: {bytesToGB(used)}GB
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
              Google Drive 연결이 끊어져 있습니다. 앱을 재시작하면 자동으로 재연동됩니다.
            </ThemedText>
          )}
        </Card>

        {/* 설정 메뉴 */}
        <Card style={styles.menuCard}>
          {[
            { icon: 'notifications-outline' as const, label: '알림 설정' },
            { icon: 'help-circle-outline' as const, label: '도움말' },
            { icon: 'information-circle-outline' as const, label: '앱 정보' },
          ].map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.menuItem,
                idx > 0 && { borderTopWidth: 0.5, borderTopColor: borderColor },
              ]}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={20} color={placeholderColor} />
                <ThemedText style={Typography.body}>{item.label}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={placeholderColor} />
            </View>
          ))}
        </Card>

        {/* 로그아웃 */}
        <Button
          title="로그아웃"
          variant="text"
          onPress={() => setShowLogoutDialog(true)}
          style={styles.logoutButton}
        />
      </ScrollView>

      <ConfirmDialog
        visible={showLogoutDialog}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmLabel="로그아웃"
        destructive
        onConfirm={() => {
          setShowLogoutDialog(false);
          logout();
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: 120,
  },
  profileCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  driveCard: {
    gap: Spacing.md,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  driveIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  driveUsage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoutButton: {
    marginTop: Spacing.sm,
  },
});
