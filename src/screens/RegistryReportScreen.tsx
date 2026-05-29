import { useCallback, useEffect, useMemo, useState } from 'react';

import {

  ActivityIndicator,

  Alert,

  Pressable,

  ScrollView,

  Text,

  View,

} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DateRangePicker } from '../components/DateRangePicker';

import { ExcelExportButton } from '../components/ExcelExportButton';

import { FilterChipRow } from '../components/FilterChipRow';

import { QuickPeriodRow } from '../components/QuickPeriodRow';

import { RegistryTypeToggle, type RegistryReportType } from '../components/RegistryTypeToggle';

import { ScreenHeader } from '../components/ScreenHeader';

import { ErrorText, LoadingScreen } from '../components/ui';

import { apiErrorMessage } from '../api/client';

import { listDrivers } from '../api/drivers';

import { listTrips, isTripCompleted } from '../api/trips';

import { listVehicles } from '../api/vehicles';

import type { RootStackParamList } from '../navigation/types';

import { screenUi } from '../styles/screenUi';

import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';

import {

  getQuickPeriodBounds,

  type QuickPeriod,

} from '../utils/datePeriods';

import { withFallback } from '../utils/safeRequest';

import type { Driver, TripRecord, Vehicle } from '../types';



export function RegistryReportScreen() {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const initialBounds = getQuickPeriodBounds('30days');

  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>('30days');

  const [from, setFrom] = useState(initialBounds.from);

  const [to, setTo] = useState(initialBounds.to);

  const [registryType, setRegistryType] = useState<RegistryReportType>('general');

  const [driverId, setDriverId] = useState<number | null>(null);

  const [vehicleId, setVehicleId] = useState<number | null>(null);

  const [rows, setRows] = useState<TripRecord[]>([]);

  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    const bounds = getQuickPeriodBounds(quickPeriod);

    setFrom(bounds.from);

    setTo(bounds.to);

  }, [quickPeriod]);



  const load = useCallback(async () => {

    try {

      setError(null);

      const [driversData, vehiclesData, tripsData] = await Promise.all([

        withFallback(() => listDrivers(), []),

        withFallback(() => listVehicles(), []),

        withFallback(

          () =>

            listTrips({
              driver_id: driverId ?? undefined,
              from: from.trim() || undefined,
              to: to.trim() || undefined,
              status: 'completed',
            }),

          []

        ),

      ]);

      setDrivers(driversData);

      setVehicles(vehiclesData);

      let filtered = tripsData.filter((item) => isTripCompleted(item));

      if (registryType === 'by_vehicle' && vehicleId != null) {

        const vehicle = vehiclesData.find((item) => item.id === vehicleId);

        if (vehicle?.plate_number) {

          filtered = filtered.filter((item) => item.driver_car_number === vehicle.plate_number);

        }

      }

      setRows(filtered);

    } catch (e) {

      setError(apiErrorMessage(e, 'Не удалось загрузить реестр'));

    }

  }, [driverId, from, registryType, to, vehicleId]);



  useEffect(() => {

    setLoading(true);

    load().finally(() => setLoading(false));

  }, [load]);



  const driverChips = useMemo(

    () => [

      { id: 'all', label: '👥 Все' },

      ...drivers.map((driver) => ({

        id: String(driver.id),

        label: driver.full_name ?? driver.email,

      })),

    ],

    [drivers]

  );



  const vehicleChips = useMemo(

    () => [

      { id: 'all', label: '🚚 Все машины' },

      ...vehicles.map((vehicle) => ({

        id: String(vehicle.id),

        label: vehicle.plate_number,

      })),

    ],

    [vehicles]

  );



  const onExport = async () => {

    if (!from.trim() || !to.trim()) {

      Alert.alert('Укажите период', 'Выберите даты «С» и «ПО»');

      return;

    }

    if (registryType === 'by_vehicle' && vehicleId == null) {

      Alert.alert('Выберите машину', 'Для реестра по машине укажите автомобиль');

      return;

    }



    setExporting(true);

    try {

      const query = buildExportQuery({

        date_from: from.trim(),

        date_to: to.trim(),

        driver_id: driverId ?? undefined,

        vehicle_id: registryType === 'by_vehicle' ? vehicleId ?? undefined : undefined,

      });

      const filename =

        registryType === 'by_vehicle' ? 'reestr_po_mashine.xlsx' : 'reestr_perevozok.xlsx';

      await downloadAndShareExcel(`/export/registry${query}`, filename);

    } finally {

      setExporting(false);

    }

  };



  if (loading && drivers.length === 0 && rows.length === 0) {

    return <LoadingScreen label="Загрузка реестра…" />;

  }



  return (

    <ScrollView style={screenUi.container} contentContainerStyle={{ paddingBottom: 32 }}>

      <View style={screenUi.content}>

        <ScreenHeader

          title="Реестр"

          showBack

          onBack={() => navigation.replace('AdminHome')}

        />



        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>

          Быстрый выбор периода

        </Text>

        <QuickPeriodRow

          items={[

            { id: 'today', label: 'Сегодня' },

            { id: '7days', label: '7 дней' },

            { id: '30days', label: '30 дней' },

            { id: '90days', label: '90 дней' },

          ]}

          activeId={quickPeriod}

          onSelect={setQuickPeriod}

        />



        <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />



        <RegistryTypeToggle value={registryType} onChange={setRegistryType} />



        <Text style={screenUi.filterLabel}>Водитель:</Text>

        <FilterChipRow

          items={driverChips}

          activeId={driverId == null ? 'all' : String(driverId)}

          onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}

        />



        {registryType === 'by_vehicle' ? (

          <>

            <Text style={screenUi.filterLabel}>Автомобиль:</Text>

            <FilterChipRow

              items={vehicleChips}

              activeId={vehicleId == null ? 'all' : String(vehicleId)}

              onSelect={(id) => setVehicleId(id === 'all' ? null : Number(id))}

            />

          </>

        ) : null}



        <ExcelExportButton

          label="📥 Скачать реестр Excel (.xlsx)"

          loading={exporting}

          onPress={() => void onExport()}

        />

        <Text style={[screenUi.hint, { marginTop: 10 }]}>

          {registryType === 'by_vehicle'

            ? 'Экспорт реестра по выбранной машине'

            : 'Общий реестр перевозок за период'}

        </Text>



        <Pressable

          onPress={() => void load()}

          style={{

            marginTop: 10,

            backgroundColor: '#eef2ff',

            borderRadius: 10,

            paddingVertical: 12,

            alignItems: 'center',

            borderWidth: 1,

            borderColor: '#bfdbfe',

          }}

        >

          <Text style={{ color: '#2563eb', fontWeight: '600' }}>🔍 Применить фильтр</Text>

        </Pressable>



        <ErrorText message={error} />



        {loading ? (

          <ActivityIndicator style={{ marginTop: 24 }} color="#2563eb" />

        ) : (

          <Text style={[screenUi.countLabel, { textAlign: 'left', marginTop: 16 }]}>

            Разгрузок за период: {rows.length}

          </Text>

        )}

      </View>

    </ScrollView>

  );

}


